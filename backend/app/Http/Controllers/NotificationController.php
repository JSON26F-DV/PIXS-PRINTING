<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $isCustomer = $user instanceof Customer;

        $query = Notification::query();
        if ($isCustomer) {
            $query->where('customer_id', $user->id);
        } else {
            $query->where('employee_id', $user->id);
        }

        $notifications = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $notifications,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'message' => 'required|string',
            'type' => 'required|string',
            'employee_id' => 'nullable|string',
            'customer_id' => 'nullable|string',
        ]);

        $user = $request->user();
        $isCustomer = $user instanceof Customer;

        $notification = Notification::create([
            'id' => (string) Str::uuid(),
            'customer_id' => $validated['customer_id'] ?? ($isCustomer ? $user->id : null),
            'employee_id' => $validated['employee_id'] ?? (! $isCustomer ? $user->id : null),
            'title' => $validated['title'],
            'message' => $validated['message'],
            'type' => $validated['type'],
            'is_read' => false,
        ]);

        return response()->json(['data' => $notification], 201);
    }

    public function markAsRead(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $isCustomer = $user instanceof Customer;

        $notification = Notification::where('id', $id)
            ->where(function ($q) use ($user, $isCustomer) {
                if ($isCustomer) {
                    $q->where('customer_id', $user->id);
                } else {
                    $q->where('employee_id', $user->id);
                }
            })
            ->first();

        if ($notification) {
            $notification->update(['is_read' => true]);
        }

        return response()->json(['message' => 'Marked as read']);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $isCustomer = $user instanceof Customer;

        $query = Notification::query();
        if ($isCustomer) {
            $query->where('customer_id', $user->id);
        } else {
            $query->where('employee_id', $user->id);
        }
        $query->update(['is_read' => true]);

        return response()->json(['message' => 'All marked as read']);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $isCustomer = $user instanceof Customer;

        Notification::where('id', $id)
            ->where(function ($q) use ($user, $isCustomer) {
                if ($isCustomer) {
                    $q->where('customer_id', $user->id);
                } else {
                    $q->where('employee_id', $user->id);
                }
            })
            ->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    public function clearAll(Request $request): JsonResponse
    {
        $user = $request->user();
        $isCustomer = $user instanceof Customer;

        $query = Notification::query();
        if ($isCustomer) {
            $query->where('customer_id', $user->id);
        } else {
            $query->where('employee_id', $user->id);
        }
        $query->delete();

        return response()->json(['message' => 'All notifications deleted']);
    }

    /* Admin Notifications CRUD */
    public function adminIndex(Request $request): JsonResponse
    {
        $notifications = Notification::orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $notifications,
        ]);
    }

    public function adminStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'message' => 'required|string',
            'type' => 'required|string',
            'customer_id' => 'nullable|string',
            'employee_id' => 'nullable|string',
        ]);

        $notification = Notification::create([
            'id' => (string) Str::uuid(),
            'customer_id' => $validated['customer_id'] ?? null,
            'employee_id' => $validated['employee_id'] ?? null,
            'title' => $validated['title'],
            'message' => $validated['message'],
            'type' => $validated['type'],
            'is_read' => false,
        ]);

        return response()->json(['data' => $notification], 201);
    }

    public function adminUpdate(Request $request, $id): JsonResponse
    {
        $notification = Notification::findOrFail($id);

        $validated = $request->validate([
            'title' => 'nullable|string',
            'message' => 'nullable|string',
            'type' => 'nullable|string',
            'customer_id' => 'nullable|string',
            'employee_id' => 'nullable|string',
            'is_read' => 'nullable|boolean',
        ]);

        $notification->update($validated);

        return response()->json(['data' => $notification]);
    }

    public function adminDestroy(Request $request, $id): JsonResponse
    {
        $notification = Notification::findOrFail($id);
        $notification->delete();

        return response()->json(['message' => 'Notification deleted successfully']);
    }
}
