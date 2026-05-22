<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    /**
     * Get messages for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = min((int) $request->query('per_page', 30), 100);
        $page = max((int) $request->query('page', 1), 1);
        $offset = ($page - 1) * $perPage;

        // Whitelist columns — original_text is intentionally excluded (spec: never expose to client)
        $safeColumns = [
            'id', 'conversation_id', 'sender_id', 'sender_type',
            'receiver_id', 'receiver_type', 'message',
            'reply_to_id', 'is_edited', 'is_deleted', 'is_read',
            'order_id', 'screenplate_request_id',
            'created_at', 'updated_at',
        ];

        if ($user->role === 'customer') {
            $messages = DB::table('messages')
                ->select($safeColumns)
                ->where(function ($q) use ($user) {
                    $q->where('sender_id', $user->id)
                        ->orWhere('receiver_id', $user->id);
                })
                ->orderBy('created_at', 'asc')
                ->limit($perPage)
                ->offset($offset)
                ->get();
        } else {
            $messages = DB::table('messages')
                ->select($safeColumns)
                ->orderBy('created_at', 'asc')
                ->limit($perPage)
                ->offset($offset)
                ->get();
        }

        $messageIds = $messages->pluck('id');

        // Batch-fetch attachments and reactions (2 queries, not N+1)
        $attachmentsGrouped = DB::table('message_attachments')->whereIn('message_id', $messageIds)->get()->groupBy('message_id');
        $reactionsGrouped = DB::table('message_reactions')->whereIn('message_id', $messageIds)->get()->groupBy('message_id');

        $messages = $messages->map(function ($msg) use ($attachmentsGrouped, $reactionsGrouped) {
            $msg->attachments = $attachmentsGrouped->get($msg->id, collect())->values();
            $msg->reactions = $reactionsGrouped->get($msg->id, collect())->values();

            return $msg;
        });

        return response()->json([
            'data' => $messages,
        ]);
    }

    /**
     * Get the total image upload count for the authenticated user.
     */
    public function getImageUploadCount(Request $request): JsonResponse
    {
        $user = $request->user();

        $count = DB::table('message_attachments')
            ->join('messages', 'messages.id', '=', 'message_attachments.message_id')
            ->where('messages.sender_id', $user->id)
            ->where('message_attachments.type', 'image')
            ->count();

        return response()->json([
            'count' => $count,
            'limit' => 20,
            'remaining' => max(0, 20 - $count),
        ]);
    }

    /**
     * Store new message.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'nullable|string|max:5000',  // nullable: attachment-only msgs allowed
            'receiver_id' => 'required|string|max:20',
            'receiver_type' => 'required|in:employee,customer',
            'reply_to_id' => 'nullable|string|max:30',
            'order_id' => 'nullable|string|max:30',
            'screenplate_request_id' => 'nullable|string|max:20',
            'attachments' => 'nullable|array|max:20',
            'attachments.*.file' => [
                'nullable', 'file', 'max:5120',           // 5 MB in KB (reduced from 10MB)
                'mimes:jpeg,jpg,png,webp,pdf,doc,docx,csv,xls,xlsx',
            ],
            'attachments.*.type' => 'required|in:image,file',
            'attachments.*.url' => 'nullable|string|max:500',
            'attachments.*.name' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $senderId = $user->id;
        $senderType = $user->role === 'customer' ? 'customer' : 'employee';

        // ─── 20-Image Upload Limit (Customers Only) ───
        $attachments = $request->input('attachments', []);
        $newImageCount = collect($attachments)->where('type', 'image')->count();

        if ($senderType === 'customer' && $newImageCount > 0) {
            $existingImageCount = DB::table('message_attachments')
                ->join('messages', 'messages.id', '=', 'message_attachments.message_id')
                ->where('messages.sender_id', $senderId)
                ->where('message_attachments.type', 'image')
                ->count();

            if (($existingImageCount + $newImageCount) > 20) {
                return response()->json([
                    'message' => 'You have reached the 20-image upload limit. Please wait for an admin to review and manage your uploads.',
                    'error_code' => 'IMAGE_LIMIT_EXCEEDED',
                    'current_count' => $existingImageCount,
                    'limit' => 20,
                ], 422);
            }
        }

        // ─── Validate individual file sizes (server-side double-check) ───
        foreach ($attachments as $index => $att) {
            if ($request->hasFile("attachments.{$index}.file")) {
                $file = $request->file("attachments.{$index}.file");
                $type = $att['type'];

                // Block video files
                if (str_starts_with($file->getMimeType(), 'video/')) {
                    return response()->json([
                        'message' => 'Video uploads are not allowed.',
                        'error_code' => 'VIDEO_NOT_ALLOWED',
                    ], 422);
                }

                // Image: max 3MB
                if ($type === 'image' && $file->getSize() > (3 * 1024 * 1024)) {
                    return response()->json([
                        'message' => "Image \"{$file->getClientOriginalName()}\" exceeds the 3MB limit.",
                        'error_code' => 'IMAGE_TOO_LARGE',
                    ], 422);
                }

                // Document: max 5MB
                if ($type === 'file' && $file->getSize() > (5 * 1024 * 1024)) {
                    return response()->json([
                        'message' => "Document \"{$file->getClientOriginalName()}\" exceeds the 5MB limit.",
                        'error_code' => 'DOC_TOO_LARGE',
                    ], 422);
                }
            }
        }

        // Automatically enforce that customers message the admin,
        // regardless of frontend input, prioritizing database security natively.
        if ($senderType === 'customer') {
            $receiverId = '1';
            $receiverType = 'employee';
        } else {
            $receiverId = $validated['receiver_id'];
            $receiverType = $validated['receiver_type'];
        }

        // Conversation ID (Employee ID first, then Customer ID)
        if ($senderType === 'customer') {
            $convId = $receiverId.'_'.$senderId;
        } else {
            $convId = $senderId.'_'.$receiverId;
        }

        $msgId = 'msg_'.Str::random(10);

        DB::transaction(function () use ($msgId, $convId, $senderId, $senderType, $receiverId, $receiverType, $validated, $attachments, $request) {
            // Ensure conversation exists
            DB::insert('INSERT IGNORE INTO conversations (id, created_at, updated_at) VALUES (?, NOW(), NOW())', [$convId]);

            // Insert message
            DB::insert('
                INSERT INTO messages 
                (id, conversation_id, sender_id, sender_type, receiver_id, receiver_type, message, order_id, screenplate_request_id, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ', [
                $msgId,
                $convId,
                $senderId,
                $senderType,
                $receiverId,
                $receiverType,
                $validated['message'],
                $validated['order_id'] ?? null,
                $validated['screenplate_request_id'] ?? null,
            ]);

            if (! empty($attachments)) {
                $attachmentsData = [];
                foreach ($attachments as $index => $att) {
                    $type = $att['type'];
                    $name = $att['name'];

                    if ($request->hasFile("attachments.{$index}.file")) {
                        $file = $request->file("attachments.{$index}.file");

                        $folder = $type === 'image' ? 'message_media' : 'message_document';
                        $destPath = base_path('../frontend/src/assets/'.$folder);

                        if (! file_exists($destPath)) {
                            mkdir($destPath, 0755, true);
                        }

                        $filename = time().'_'.$file->getClientOriginalName();
                        $file->move($destPath, $filename);

                        // Per requirement, save only the filename
                        $name = $filename;
                    }

                    $attachmentsData[] = [
                        'message_id' => $msgId,
                        'type' => $type,
                        'url' => $name, // Saving filename as URL as well
                        'name' => $name,
                    ];
                }
                DB::table('message_attachments')->insert($attachmentsData);
            }
        });

        return response()->json([
            'message' => 'Message transmitted securely.',
            'data' => [
                'id' => $msgId,
            ],
        ]);
    }

    /**
     * Mark all messages in a conversation as read for the authenticated user.
     * IDOR protection: only messages where receiver_id = current user are updated.
     */
    public function markConversationAsRead(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_id' => 'required|string|max:100',
        ]);

        $user = $request->user();

        DB::table('messages')
            ->where('conversation_id', $validated['conversation_id'])
            ->where('receiver_id', $user->id)  // IDOR guard: only own messages
            ->where('is_read', 0)
            ->update(['is_read' => 1, 'updated_at' => now()]);

        return response()->json(['message' => 'Marked as read.']);
    }
}
