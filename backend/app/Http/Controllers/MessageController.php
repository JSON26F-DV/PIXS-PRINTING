<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    /**
     * Store new message.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'receiver_id' => 'required|string',
            'receiver_type' => 'required|in:employee,customer',
        ]);

        $user = $request->user();
        $senderId = $user->id;
        $senderType = $user->role === 'customer' ? 'customer' : 'employee';

        $receiverId = $validated['receiver_id'];
        $receiverType = $validated['receiver_type'];

        // Conversation ID (Employee ID first, then Customer ID)
        if ($senderType === 'customer') {
            $convId = $receiverId . '_' . $senderId;
        } else {
            $convId = $senderId . '_' . $receiverId;
        }

        $msgId = 'msg_' . Str::random(10);

        DB::transaction(function () use ($msgId, $convId, $senderId, $senderType, $receiverId, $receiverType, $validated) {
            // Ensure conversation exists
            DB::insert('INSERT IGNORE INTO conversations (id, created_at, updated_at) VALUES (?, NOW(), NOW())', [$convId]);

            // Insert message
            DB::insert('
                INSERT INTO messages 
                (id, conversation_id, sender_id, sender_type, receiver_id, receiver_type, message, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ', [
                $msgId,
                $convId,
                $senderId,
                $senderType,
                $receiverId,
                $receiverType,
                $validated['message']
            ]);
        });

        return response()->json([
            'message' => 'Message transmitted securely to PIXS Admin.',
            'data' => [
                'id' => $msgId
            ]
        ]);
    }
}
