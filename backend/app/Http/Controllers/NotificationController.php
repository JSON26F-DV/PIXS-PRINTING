<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $notifications = Notification::where('customer_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $notifications
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
            'id' => \Illuminate\Support\Str::uuid(),
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
}
