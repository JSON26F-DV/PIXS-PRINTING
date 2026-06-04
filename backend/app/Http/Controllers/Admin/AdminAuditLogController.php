<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AdminAuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::query();

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('user_type')) {
            $query->where('user_type', $request->user_type);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                    ->orWhere('entity_id', 'like', "%{$search}%")
                    ->orWhere('details', 'like', "%{$search}%");
            });
        }

        $perPage = $request->input('per_page', 25);
        $logs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Enhance with user names, action labels, etc.
        $customerIds = [];
        $employeeIds = [];

        foreach ($logs->items() as $log) {
            if ($log->user_type === 'customer') {
                $customerIds[] = $log->user_id;
            } elseif (in_array($log->user_type, ['admin', 'staff', 'technician', 'inventory', 'employee'])) {
                $employeeIds[] = $log->user_id;
            }
        }

        $customers = Customer::whereIn('id', array_unique($customerIds))->get()->keyBy('id');
        $employees = Employee::whereIn('id', array_unique($employeeIds))->get()->keyBy('id');

        $items = collect($logs->items())->map(function ($log) use ($customers, $employees) {
            $userName = 'System / Guest';
            if ($log->user_type === 'customer' && isset($customers[$log->user_id])) {
                $userName = $customers[$log->user_id]->first_name.' '.$customers[$log->user_id]->last_name;
            } elseif (isset($employees[$log->user_id])) {
                $userName = $employees[$log->user_id]->first_name.' '.$employees[$log->user_id]->last_name;
            }

            $detailsDecoded = is_string($log->details) ? json_decode($log->details, true) : $log->details;

            return [
                'id' => $log->id,
                'user_id' => $log->user_id,
                'user_type' => $log->user_type,
                'user_name' => $userName,
                'action' => $log->action,
                'action_label' => ucfirst(str_replace('_', ' ', $log->action)),
                'action_color' => $this->getActionColor($log->action),
                'entity_type' => $log->entity_type,
                'entity_id' => $log->entity_id,
                'details' => $detailsDecoded,
                'ip_address' => $log->ip_address ?? '',
                'user_agent' => $log->user_agent,
                'created_at' => $log->created_at->toIso8601String(),
                'created_at_formatted' => $log->created_at->format('M d, Y h:i A'),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $items,
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    public function stats(Request $request)
    {
        $total = AuditLog::count();
        $today = AuditLog::whereDate('created_at', Carbon::today())->count();

        $byActionRaw = AuditLog::selectRaw('action, COUNT(*) as count')
            ->groupBy('action')
            ->get();
        $byAction = $byActionRaw->pluck('count', 'action')->toArray();

        $byEntityRaw = AuditLog::selectRaw('entity_type, COUNT(*) as count')
            ->groupBy('entity_type')
            ->get();
        $byEntity = $byEntityRaw->pluck('count', 'entity_type')->toArray();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total' => $total,
                'today' => $today,
                'by_action' => $byAction,
                'by_entity' => $byEntity,
            ],
        ]);
    }

    private function getActionColor($action)
    {
        switch ($action) {
            case 'create':
            case 'login':
                return 'emerald';
            case 'update':
                return 'blue';
            case 'delete':
            case 'logout':
                return 'rose';
            case 'print':
            case 'export':
                return 'purple';
            default:
                return 'slate';
        }
    }

    public function show($id)
    {
        $log = AuditLog::findOrFail($id);

        $userName = 'System / Guest';
        if ($log->user_type === 'customer') {
            $customer = Customer::find($log->user_id);
            if ($customer) {
                $userName = $customer->first_name.' '.$customer->last_name;
            }
        } elseif (in_array($log->user_type, ['admin', 'staff', 'technician', 'inventory', 'employee'])) {
            $employee = Employee::find($log->user_id);
            if ($employee) {
                $userName = $employee->first_name.' '.$employee->last_name;
            }
        }

        $detailsDecoded = is_string($log->details) ? json_decode($log->details, true) : $log->details;

        $data = [
            'id' => $log->id,
            'user_id' => $log->user_id,
            'user_type' => $log->user_type,
            'user_name' => $userName,
            'action' => $log->action,
            'action_label' => ucfirst(str_replace('_', ' ', $log->action)),
            'action_color' => $this->getActionColor($log->action),
            'entity_type' => $log->entity_type,
            'entity_id' => $log->entity_id,
            'details' => $detailsDecoded,
            'ip_address' => $log->ip_address ?? '',
            'user_agent' => $log->user_agent,
            'created_at' => $log->created_at->toIso8601String(),
            'created_at_formatted' => $log->created_at->format('M d, Y h:i A'),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    public function update(Request $request, $id)
    {
        $log = AuditLog::findOrFail($id);

        if ($request->has('details')) {
            $log->details = is_string($request->details) ? $request->details : json_encode($request->details);
        }

        $log->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Audit log updated successfully',
        ]);
    }

    public function destroy($id)
    {
        $log = AuditLog::findOrFail($id);
        $log->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Audit log deleted successfully',
        ]);
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'string|exists:audit_logs,id',
        ]);

        AuditLog::whereIn('id', $request->ids)->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Audit logs deleted successfully',
        ]);
    }
}
