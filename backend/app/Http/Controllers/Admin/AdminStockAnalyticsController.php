<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expenditure;
use App\Models\InventoryLog;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminStockAnalyticsController extends Controller
{
    /**
     * Get stock analytics dashboard data.
     */
    public function index(Request $request)
    {
        // Load products with their variants
        $products = Product::with('variants')->get();

        // Load expenditures (we will just return all or a limited set for the logs,
        // but for calculations we might need all if we compute in frontend,
        // or we compute in backend and just send latest logs).
        // The instructions imply we should return products, variants, and expenditures
        // to be seen in StockAnalytics.tsx. Let's return all expenditures.
        $expenditures = Expenditure::orderBy('created_at', 'desc')->get();

        // Load all inventory logs with their employee and product relationships
        $inventoryLogs = InventoryLog::with(['employee', 'product'])->orderBy('date', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'products' => $products,
                'expenditures' => $expenditures,
                'inventory_logs' => $inventoryLogs,
            ],
        ]);
    }

    /**
     * Store a new expenditure (Extra Expenses).
     */
    public function storeExpenditure(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string|in:Employee Salaries,Raw Materials / Products,Utilities,Office / Operational Expenses,Extra / Miscellaneous Expenses,Refund,Others',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'variant_id' => 'nullable|string|exists:product_variants,variant_id',
        ]);

        $expenditure = Expenditure::create($validated);

        AuditService::created('expenditure', $expenditure->id, $validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Expenditure logged successfully',
            'data' => $expenditure,
        ], 201);
    }

    /**
     * Update an existing expenditure.
     */
    public function updateExpenditure(Request $request, $id)
    {
        $expenditure = Expenditure::findOrFail($id);

        $validated = $request->validate([
            'category' => 'sometimes|string|in:Employee Salaries,Raw Materials / Products,Utilities,Office / Operational Expenses,Extra / Miscellaneous Expenses,Refund,Others',
            'amount' => 'sometimes|numeric|min:0',
            'description' => 'nullable|string',
            'variant_id' => 'nullable|string|exists:product_variants,variant_id',
        ]);

        $expenditure->update($validated);

        AuditService::updated('expenditure', $id, [], $validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Expenditure updated successfully',
            'data' => $expenditure,
        ]);
    }

    /**
     * Delete an expenditure.
     */
    public function destroyExpenditure($id)
    {
        $expenditure = Expenditure::findOrFail($id);
        $expenditure->delete();

        AuditService::deleted('expenditure', $id);

        return response()->json([
            'status' => 'success',
            'message' => 'Expenditure deleted successfully',
        ]);
    }

    /**
     * Update stock for a product variant (Add or Reduce).
     */
    public function updateVariantStock(Request $request, $variant_id)
    {
        $request->validate([
            'action' => 'required|string|in:add,reduce',
            'quantity' => 'required|integer|min:1',
            'description' => 'nullable|string',
        ]);

        $variant = ProductVariant::where('variant_id', $variant_id)->first();
        if (! $variant) {
            return response()->json([
                'status' => 'error',
                'message' => 'Product variant not found.',
            ], 404);
        }

        $action = $request->input('action');
        $quantity = (int) $request->input('quantity');
        $employeeId = $request->user()->id;

        try {
            DB::transaction(function () use ($variant, $action, $quantity, $employeeId, $request) {
                if ($action === 'add') {
                    // Update stock
                    $variant->stock += $quantity;
                    $variant->save();

                    // Calculate expenditure amount: quantity added * price of variant
                    $amount = $quantity * (float) $variant->price;

                    // Log in expenditures table
                    $expenditure = Expenditure::create([
                        'variant_id' => $variant->variant_id,
                        'category' => 'Raw Materials / Products',
                        'amount' => $amount,
                        'description' => $request->input('description') ?: "The stock for {$variant->variant_id} has been increased by {$quantity}",
                    ]);

                    // Log in inventory_logs table
                    InventoryLog::create([
                        'id' => 'LOG-'.strtoupper(Str::random(10)),
                        'employee_id' => $employeeId,
                        'product_id' => $variant->product_id,
                        'variant_id' => $variant->variant_id,
                        'expenditure_id' => $expenditure->id,
                        'product_name' => $variant->product ? $variant->product->name : 'Unknown Product',
                        'qty_added' => $quantity,
                        'cost' => $amount,
                        'type' => 'RESTOCK',
                        'notes' => $request->input('description') ?: "Restocked {$quantity} units of variant {$variant->size}",
                        'date' => now(),
                    ]);
                } else {
                    // Reduce stock
                    if ($variant->stock < $quantity) {
                        throw new \Exception("Cannot reduce stock below 0. Current stock is {$variant->stock}.");
                    }
                    $variant->stock -= $quantity;
                    $variant->save();

                    // Log in inventory_logs table
                    InventoryLog::create([
                        'id' => 'LOG-'.strtoupper(Str::random(10)),
                        'employee_id' => $employeeId,
                        'product_id' => $variant->product_id,
                        'variant_id' => $variant->variant_id,
                        'expenditure_id' => null,
                        'product_name' => $variant->product ? $variant->product->name : 'Unknown Product',
                        'qty_added' => -$quantity, // negative for reduction
                        'cost' => 0,
                        'type' => 'ADJUSTMENT',
                        'notes' => "Reduced {$quantity} units of variant {$variant->size}",
                        'date' => now(),
                    ]);
                }
            });

            AuditService::log('stock_update', 'product_variant', $variant_id, [
                'action' => $action,
                'quantity' => $quantity,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Stock updated successfully.',
                'data' => [
                    'variant_id' => $variant->variant_id,
                    'stock' => $variant->stock,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Undo a stock adjustment from inventory_logs.
     */
    public function undoLog(Request $request, $id)
    {
        $log = InventoryLog::findOrFail($id);

        try {
            DB::transaction(function () use ($log) {
                // 1. Revert variant stock
                if ($log->variant_id) {
                    $variant = ProductVariant::where('variant_id', $log->variant_id)->first();
                    if ($variant) {
                        // Revert: subtract qty_added (if qty_added was positive/restock, stock decreases. if negative/reduction, stock increases)
                        $variant->stock -= $log->qty_added;
                        if ($variant->stock < 0) {
                            $variant->stock = 0;
                        }
                        $variant->save();
                    }
                }

                // 2. Remove associated expenditure
                if ($log->expenditure_id) {
                    $expenditure = Expenditure::find($log->expenditure_id);
                    if ($expenditure) {
                        $expenditure->delete();
                    }
                }

                // 3. Delete the inventory log itself
                $log->delete();
            });

            AuditService::log('undo_stock', 'inventory_log', $id);

            return response()->json([
                'status' => 'success',
                'message' => 'Stock adjustment successfully reverted and undone.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to revert action: '.$e->getMessage(),
            ], 400);
        }
    }
}
