<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expenditure;
use App\Models\Product;
use Illuminate\Http\Request;

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

        return response()->json([
            'status' => 'success',
            'data' => [
                'products' => $products,
                'expenditures' => $expenditures,
            ]
        ]);
    }

    /**
     * Store a new expenditure (Extra Expenses).
     */
    public function storeExpenditure(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string|in:Employee Salaries,Raw Materials / Products,Utilities,Office / Operational Expenses,Extra / Miscellaneous Expenses,Others',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'variant_id' => 'nullable|string|exists:product_variants,variant_id',
        ]);

        $expenditure = Expenditure::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Expenditure logged successfully',
            'data' => $expenditure
        ], 201);
    }

    /**
     * Update an existing expenditure.
     */
    public function updateExpenditure(Request $request, $id)
    {
        $expenditure = Expenditure::findOrFail($id);
        
        $validated = $request->validate([
            'category' => 'sometimes|string|in:Employee Salaries,Raw Materials / Products,Utilities,Office / Operational Expenses,Extra / Miscellaneous Expenses,Others',
            'amount' => 'sometimes|numeric|min:0',
            'description' => 'nullable|string',
            'variant_id' => 'nullable|string|exists:product_variants,variant_id',
        ]);

        $expenditure->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Expenditure updated successfully',
            'data' => $expenditure
        ]);
    }

    /**
     * Delete an expenditure.
     */
    public function destroyExpenditure($id)
    {
        $expenditure = Expenditure::findOrFail($id);
        $expenditure->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Expenditure deleted successfully'
        ]);
    }
}
