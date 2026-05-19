<?php

namespace App\Http\Controllers;

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

        $notifications = Notification::where('customer_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $notifications,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'message' => 'required|string',
            'type' => 'required|in:info,success,warning,error',
        ]);

        $notification = Notification::create([
            'id' => Str::uuid(),
            'customer_id' => $request->user()->id,
            'title' => $validated['title'],
            'message' => $validated['message'],
            'type' => $validated['type'],
            'is_read' => false,
        ]);

        return response()->json(['data' => $notification], 201);
    }

    public function markAsRead(Request $request, $id): JsonResponse
    {
        $notification = Notification::where('customer_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if ($notification) {
            $notification->update(['is_read' => true]);
        }

        return response()->json(['message' => 'Marked as read']);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        Notification::where('customer_id', $request->user()->id)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'All marked as read']);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        Notification::where('customer_id', $request->user()->id)
            ->where('id', $id)
            ->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    public function clearAll(Request $request): JsonResponse
    {
        Notification::where('customer_id', $request->user()->id)
            ->delete();

        return response()->json(['message' => 'All notifications deleted']);
    }
}
