<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\ScreenplateRequest;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    /**
     * Get messages.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = min((int) $request->query('per_page', 30), 100);
        $cursor = $request->query('cursor');

        // Whitelist columns — original_text is intentionally excluded (spec: never expose to client)
        $safeColumns = [
            'id', 'conversation_id', 'sender_id', 'sender_type',
            'receiver_id', 'receiver_type', 'message',
            'reply_to_id', 'is_edited', 'is_deleted', 'is_read',
            'message_type', 'type_id', 'is_pinned', 'is_confirm',
            'product_concern', 'is_email',
            'created_at', 'updated_at',
        ];

        $query = DB::table('messages')
            ->select($safeColumns)
            ->orderBy('created_at', 'desc');

        if ($cursor) {
            $cursorMsg = DB::table('messages')->where('id', $cursor)->first();
            if ($cursorMsg) {
                $query->where('created_at', '<', $cursorMsg->created_at);
            }
        }

        if ($user->role === 'admin') {
            $targetId = $request->query('target_id');
            if ($targetId) {
                $query->where(function ($q) use ($targetId) {
                    $q->where('sender_id', $targetId)
                        ->orWhere('receiver_id', $targetId);
                });
            } else {
                $query->whereRaw('1 = 0');
            }
        } else {
            $query->where(function ($q) use ($user) {
                $q->where('sender_id', $user->id)
                    ->orWhere('receiver_id', $user->id);
            });
        }

        $messages = $query->limit($perPage)->get();

        // Mark all fetched messages as read for the current user
        if ($messages->isNotEmpty()) {
            DB::table('messages')
                ->where('receiver_id', $user->id)
                ->where('is_read', 0)
                ->whereIn('id', $messages->pluck('id'))
                ->update(['is_read' => 1]);
        }

        // Reverse for chronological ascending display on frontend
        $messages = $messages->reverse()->values();

        $messageIds = $messages->pluck('id');

        // Batch-fetch attachments
        $attachmentsGrouped = DB::table('message_attachments')->whereIn('message_id', $messageIds)->get()->groupBy('message_id');

        // Batch-fetch reactions
        $reactionsGrouped = DB::table('message_reactions')->whereIn('message_id', $messageIds)->get()->groupBy('message_id');

        // Batch-fetch reply-to messages context
        $replyToIds = $messages->pluck('reply_to_id')->filter()->unique();
        $replyToMessages = collect();
        if ($replyToIds->isNotEmpty()) {
            $replyToMessages = DB::table('messages')
                ->whereIn('id', $replyToIds)
                ->select('id', 'message', 'sender_id', 'sender_type', 'is_deleted')
                ->get()
                ->keyBy('id');
        }

        $messages = $messages->map(function ($msg) use ($attachmentsGrouped, $reactionsGrouped, $replyToMessages) {
            $msg->attachments = $attachmentsGrouped->get($msg->id, collect())->values();

            $msg->reactions = $reactionsGrouped->get($msg->id, collect())->map(function ($react) {
                return [
                    'user' => $react->user_id,
                    'emoji' => $react->emoji,
                    'user_type' => $react->user_type,
                ];
            })->values()->all();

            $msg->reply_to = null;
            if ($msg->reply_to_id && $replyToMessages->has($msg->reply_to_id)) {
                $repliedMsg = $replyToMessages->get($msg->reply_to_id);
                $msg->reply_to = [
                    'id' => $repliedMsg->id,
                    'text' => $repliedMsg->message,
                    'sender_type' => $repliedMsg->sender_type,
                    'sender_id' => $repliedMsg->sender_id,
                    'is_deleted' => $repliedMsg->is_deleted,
                ];
            }

            return $msg;
        });

        $nextCursor = $messages->isNotEmpty() && $messages->count() === $perPage ? $messages->first()->id : null;

        return response()->json([
            'data' => $messages,
            'next_cursor' => $nextCursor,
        ]);
    }

    /**
     * Get all users (employees and customers) for the chat interface.
     */
    public function getUsers(Request $request): JsonResponse
    {
        $adminId = $request->user()->id;

        // Build unread counts: messages sent TO admin (receiver_id = admin) with is_read = 0
        $unreadCounts = DB::table('messages')
            ->select('sender_id', DB::raw('COUNT(*) as unread_count'))
            ->where('receiver_id', $adminId)
            ->where('is_read', 0)
            ->where('is_deleted', 0)
            ->groupBy('sender_id')
            ->pluck('unread_count', 'sender_id');

        $employees = DB::table('employees')
            ->select('id', DB::raw("CONCAT(first_name, ' ', last_name) as name"), 'email', 'role', 'profile_picture')
            ->get()
            ->map(function ($emp) use ($unreadCounts) {
                $emp->account_type = 'employee';
                $emp->status = 'offline';
                $emp->unread_count = (int) ($unreadCounts[$emp->id] ?? 0);

                return $emp;
            });

        $customers = DB::table('customers')
            ->select('id', DB::raw("CONCAT(first_name, ' ', last_name) as name"), 'email', 'role', 'profile_picture')
            ->get()
            ->map(function ($cust) use ($unreadCounts) {
                $cust->account_type = 'customer';
                $cust->status = 'offline';
                $cust->unread_count = (int) ($unreadCounts[$cust->id] ?? 0);

                return $cust;
            });

        $users = $employees->merge($customers);

        return response()->json([
            'data' => $users,
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
            'message_type' => 'nullable|in:order,screenplate_request,payment_code,refund,expenditure',
            'type_id' => 'nullable|string|max:30',
            'order_id' => 'nullable|string|max:30',
            'screenplate_request_id' => 'nullable|string|max:20',
            'payment_code_id' => 'nullable|string|max:30',
            'product_concern' => 'nullable|boolean',
            'expenditures_id' => 'nullable|string|max:30',
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
        if ($user->role !== 'admin') {
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
        
        $messageType = $validated['message_type'] ?? null;
        $typeId = $validated['type_id'] ?? null;
        
        if (!$messageType && !$typeId) {
            if (!empty($validated['order_id'])) {
                $messageType = 'order';
                $typeId = $validated['order_id'];
            } elseif (!empty($validated['screenplate_request_id'])) {
                $messageType = 'screenplate_request';
                $typeId = $validated['screenplate_request_id'];
            } elseif (!empty($validated['payment_code_id'])) {
                $messageType = 'payment_code';
                $typeId = $validated['payment_code_id'];
            } elseif (!empty($validated['expenditures_id'])) {
                $messageType = 'expenditure';
                $typeId = $validated['expenditures_id'];
            }
        }

        DB::transaction(function () use ($msgId, $convId, $senderId, $senderType, $receiverId, $receiverType, $validated, $attachments, $request, $messageType, $typeId) {
            // Ensure conversation exists
            DB::insert('INSERT IGNORE INTO conversations (id, created_at, updated_at) VALUES (?, NOW(), NOW())', [$convId]);

            // Insert message
            DB::insert('
                INSERT INTO messages 
                (id, conversation_id, sender_id, sender_type, receiver_id, receiver_type, message, reply_to_id, message_type, type_id, product_concern, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ', [
                $msgId,
                $convId,
                $senderId,
                $senderType,
                $receiverId,
                $receiverType,
                $validated['message'],
                $validated['reply_to_id'] ?? null,
                $messageType,
                $typeId,
                ! empty($validated['product_concern']) ? 1 : 0,
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

                        $filename = Str::uuid()->toString().'.'.$file->extension();
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

        // Fetch saved attachments to return to client
        $savedAttachments = DB::table('message_attachments')->where('message_id', $msgId)->get();

        AuditService::created('message', $msgId, [
            'receiver_id' => $receiverId,
            'has_attachments' => ! empty($attachments),
        ]);

        return response()->json([
            'message' => 'Message transmitted securely.',
            'data' => [
                'id' => $msgId,
                'attachments' => $savedAttachments->map(function ($att) {
                    return [
                        'type' => $att->type,
                        'url' => $att->url,
                        'name' => $att->name,
                    ];
                })->all(),
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

    /**
     * Mark a message as confirmed (is_confirm = 1).
     */
    public function confirmMessage(string $id): JsonResponse
    {
        $user = request()->user();

        $updated = DB::table('messages')
            ->where('id', $id)
            ->where(function ($q) use ($user) {
                $q->where('sender_id', $user->id)
                    ->orWhere('receiver_id', $user->id);
            })
            ->update(['is_confirm' => 1, 'updated_at' => now()]);

        if ($updated === 0) {
            return response()->json(['message' => 'Message not found or unauthorized.'], 404);
        }

        return response()->json(['message' => 'Confirmed.']);
    }

    public function getOrderContext($id): JsonResponse
    {
        $order = Order::with([
            'items',
            'items.product',
            'items.variant',
            'items.colors.colorDetails',
            'items.screenplate',
            'address',
            'customer',
        ])->where('id', $id)->first();

        if (! $order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $formatted = [
            'order_id' => $order->id,
            'user_id' => $order->customer_id,
            'customer_name' => $order->customer ? "{$order->customer->first_name} {$order->customer->last_name}" : null,
            'company_name' => $order->customer ? $order->customer->company_name : null,
            'total_amount' => (float) $order->total_amount,
            'status' => $order->status,
            'created_at' => $order->created_at,
            'admin_comment' => $order->admin_comment,
            'feedback' => $order->feedback,
            'complaint' => $order->complaint,
            'rating' => $order->rating,
            'shipping_address' => $order->address ? [
                'label' => $order->address->adress_label,
                'region' => $order->address->region,
                'province' => $order->address->province,
                'city' => $order->address->city,
                'barangay' => $order->address->barangay,
                'street' => $order->address->street,
                'postal_code' => $order->address->postal_code,
                'contact_number' => $order->address->contact_number,
            ] : null,
            'order_items' => $order->items->map(function ($item) {
                $order_item_colors = $item->colors ? $item->colors->map(function ($c) {
                    return [
                        'id' => $c->color_id,
                        'name' => $c->colorDetails ? $c->colorDetails->name : $c->color_id,
                        'hex' => $c->colorDetails ? $c->colorDetails->hex : '#000000',
                    ];
                })->toArray() : [];

                $plate = $item->screenplate ? [
                    'id' => $item->screenplate_id,
                    'name' => $item->screenplate->plate_name ?? 'Custom Plate',
                    'type' => $item->screenplate->type ?? 'Flatscreen',
                    'channels' => (int) $item->screenplate->channels ?? 1,
                    'setupFee' => 0,
                    'printPricePerUnit' => (float) $item->plate_price,
                ] : null;

                return [
                    'id' => (string) $item->id,
                    'product_id' => $item->product_id,
                    'productName' => $item->product ? $item->product->name : 'Unknown Product',
                    'short_description' => $item->product ? $item->product->short_description : null,
                    'productImage' => $item->product && $item->product->main_image
                        ? '/images/products/'.$item->product->main_image
                        : '',
                    'quantity' => $item->quantity,
                    'variant' => [
                        'id' => $item->variant_id,
                        'size' => $item->variant ? $item->variant->size : '',
                        'width' => $item->variant ? $item->variant->width : null,
                        'height' => $item->variant ? $item->variant->height : null,
                        'unitPrice' => (float) $item->unit_price,
                    ],
                    'order_item_colors' => $order_item_colors,
                    'plate' => $plate,
                ];
            })->toArray(),
        ];

        return response()->json($formatted);
    }

    public function getScreenplateRequestContext($id): JsonResponse
    {
        $request = ScreenplateRequest::with('product')
            ->where('id', $id)
            ->first();

        if (! $request) {
            return response()->json(['notFound' => true]);
        }

        return response()->json($request);
    }

    public function getExpenditureContext($id): JsonResponse
    {
        $expenditure = DB::table('expenditures')->where('id', $id)->first();

        if (! $expenditure) {
            return response()->json(['notFound' => true], 404);
        }

        return response()->json($expenditure);
    }

    public function getRefundContext($id): JsonResponse
    {
        $refund = DB::table('refunds')
            ->select(
                'refunds.*',
                'customers.first_name as customer_first_name',
                'customers.last_name as customer_last_name',
                'customers.email as customer_email',
                'employees.first_name as employee_first_name',
                'employees.last_name as employee_last_name',
            )
            ->leftJoin('customers', 'refunds.customer_id', '=', 'customers.id')
            ->leftJoin('employees', 'refunds.employee_id', '=', 'employees.id')
            ->where('refunds.id', $id)
            ->first();

        if (! $refund) {
            return response()->json(['notFound' => true], 404);
        }

        return response()->json($refund);
    }

    /**
     * React to a message.
     */
    public function reactMessage(string $id): JsonResponse
    {
        $validated = request()->validate([
            'emoji' => 'required|string|max:10',
        ]);

        $user = request()->user();
        $userId = $user->id;
        $userType = $user->role === 'customer' ? 'customer' : 'employee';
        $emoji = $validated['emoji'];

        $message = DB::table('messages')->where('id', $id)->first();

        if (! $message) {
            return response()->json(['message' => 'Message not found.'], 404);
        }

        // Security check: only allow if user is sender or receiver of the message
        if ($message->sender_id !== $userId && $message->receiver_id !== $userId) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Upsert: replace existing reaction (one reaction per user per message)
        $existing = DB::table('message_reactions')
            ->where('message_id', $id)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            DB::table('message_reactions')
                ->where('id', $existing->id)
                ->update(['emoji' => $emoji]);
        } else {
            DB::table('message_reactions')->insert([
                'message_id' => $id,
                'user_id' => $userId,
                'user_type' => $userType,
                'emoji' => $emoji,
            ]);
        }

        return response()->json([
            'message' => 'Reaction saved.',
            'emoji' => $emoji,
        ]);
    }

    /**
     * Update a message (edit text).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:5000',
        ]);
        $user = $request->user();

        $message = DB::table('messages')->where('id', $id)->first();
        if (! $message) {
            return response()->json(['message' => 'Not found'], 404);
        }
        if ($message->sender_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ($message->is_deleted) {
            return response()->json(['message' => 'Cannot edit deleted message'], 400);
        }

        $originalText = $message->is_edited ? $message->original_text : $message->message;

        DB::table('messages')->where('id', $id)->update([
            'message' => $validated['message'],
            'is_edited' => 1,
            'original_text' => $originalText,
            'updated_at' => now(),
        ]);

        AuditService::updated('message', $id, [], ['message' => $validated['message']]);

        return response()->json(['message' => 'Message updated']);
    }

    /**
     * Soft delete a message.
     */
    public function destroy(string $id): JsonResponse
    {
        $user = request()->user();
        $isHardDelete = request()->query('hard') === 'true';

        $message = DB::table('messages')->where('id', $id)->first();
        if (! $message) {
            return response()->json(['message' => 'Not found'], 404);
        }
        if ($message->sender_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Hard delete requires admin role
        if ($isHardDelete && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized for hard delete'], 403);
        }

        // Delete physical files
        $attachments = DB::table('message_attachments')->where('message_id', $id)->get();
        foreach ($attachments as $att) {
            if ($att->type === 'image') {
                $destPath = base_path('../frontend/src/assets/message_media/'.$att->name);
            } else {
                $destPath = base_path('../frontend/src/assets/message_document/'.$att->url);
            }
            if (file_exists($destPath)) {
                unlink($destPath);
            }
        }

        // Delete related DB records
        DB::table('message_attachments')->where('message_id', $id)->delete();
        DB::table('message_reactions')->where('message_id', $id)->delete();

        if ($isHardDelete) {
            // Hard delete message
            DB::table('messages')->where('id', $id)->delete();
        } else {
            // Soft delete message
            DB::table('messages')->where('id', $id)->update([
                'is_deleted' => 1,
                'updated_at' => now(),
            ]);
        }

        AuditService::deleted('message', $id, ['hard' => $isHardDelete]);

        return response()->json(['message' => 'Message deleted']);
    }

    /**
     * Hard delete an entire conversation with a target user. Admin only.
     */
    public function destroyConversation(Request $request, string $targetId): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Admin only'], 403);
        }

        $messageIds = DB::table('messages')
            ->where(function ($q) use ($user, $targetId) {
                $q->where('sender_id', $user->id)
                    ->where('receiver_id', $targetId);
            })
            ->orWhere(function ($q) use ($user, $targetId) {
                $q->where('sender_id', $targetId)
                    ->where('receiver_id', $user->id);
            })
            ->pluck('id');

        if ($messageIds->isNotEmpty()) {
            // Delete physical files
            $attachments = DB::table('message_attachments')->whereIn('message_id', $messageIds)->get();
            foreach ($attachments as $att) {
                if ($att->type === 'image') {
                    $destPath = base_path('../frontend/src/assets/message_media/'.$att->name);
                } else {
                    $destPath = base_path('../frontend/src/assets/message_document/'.$att->url);
                }
                if (file_exists($destPath)) {
                    unlink($destPath);
                }
            }

            // Delete related DB records
            DB::table('message_attachments')->whereIn('message_id', $messageIds)->delete();
            DB::table('message_reactions')->whereIn('message_id', $messageIds)->delete();

            // Hard delete messages
            DB::table('messages')->whereIn('id', $messageIds)->delete();
        }

        AuditService::deleted('conversation', $targetId, ['message_count' => $messageIds->count()]);

        return response()->json(['message' => 'Conversation deleted successfully.']);
    }

    /**
     * Delete an attachment from a message and filesystem. Admin only.
     */
    public function destroyAttachment(Request $request, string $id, string $filename): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Admin only'], 403);
        }

        $attachment = DB::table('message_attachments')
            ->where('message_id', $id)
            ->where('name', $filename)
            ->first();

        if (! $attachment) {
            return response()->json(['message' => 'Attachment not found'], 404);
        }

        // Delete from DB
        DB::table('message_attachments')->where('id', $attachment->id)->delete();

        // Delete from filesystem
        $folder = $attachment->type === 'image' ? 'message_media' : 'message_document';
        $destPath = base_path('../frontend/src/assets/'.$folder.'/'.$attachment->url);

        if (file_exists($destPath)) {
            unlink($destPath);
        }

        AuditService::deleted('message_attachment', $attachment->id, ['message_id' => $id]);

        return response()->json(['message' => 'Attachment deleted successfully']);
    }

    /**
     * Toggle pinned status. Admin only.
     */
    public function togglePin(string $id): JsonResponse
    {
        $user = request()->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Admin only'], 403);
        }

        $message = DB::table('messages')->where('id', $id)->first();
        if (! $message) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $isPinned = $message->is_pinned ? null : now();

        DB::table('messages')->where('id', $id)->update([
            'is_pinned' => $isPinned,
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Pin status toggled', 'is_pinned' => $isPinned]);
    }

    /**
     * Manage payment code attachment. Admin only.
     */
    public function managePaymentCode(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Admin only'], 403);
        }

        $validated = $request->validate([
            'payment_code_id' => 'nullable|string|max:30',
        ]);

        $message = DB::table('messages')->where('id', $id)->first();
        if (! $message) {
            return response()->json(['message' => 'Not found'], 404);
        }

        DB::table('messages')->where('id', $id)->update([
            'message_type' => $validated['payment_code_id'] ? 'payment_code' : null,
            'type_id' => $validated['payment_code_id'],
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Payment code updated']);
    }

    /**
     * Attach refund to a message (for display purposes)
     */
    public function attachRefund(string $id): JsonResponse
    {
        $validated = request()->validate([
            'refund_id' => 'nullable|string|max:30',
            'product_concern' => 'nullable|boolean',
            'is_email' => 'nullable|boolean',
        ]);

        $user = request()->user();

        // Verify user has access to this message
        $msg = DB::table('messages')->where('id', $id)->first();
        if (! $msg || ($msg->sender_id !== $user->id && $msg->receiver_id !== $user->id)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $updateData = ['updated_at' => now()];

        if (array_key_exists('refund_id', $validated)) {
            $updateData['message_type'] = $validated['refund_id'] ? 'refund' : null;
            $updateData['type_id'] = $validated['refund_id'];
        }
        if (array_key_exists('product_concern', $validated)) {
            $updateData['product_concern'] = $validated['product_concern'] ? 1 : 0;
        }
        if (array_key_exists('is_email', $validated)) {
            $updateData['is_email'] = $validated['is_email'] ? 1 : 0;
        }

        DB::table('messages')->where('id', $id)->update($updateData);

        return response()->json(['message' => 'Message updated.']);
    }
}
