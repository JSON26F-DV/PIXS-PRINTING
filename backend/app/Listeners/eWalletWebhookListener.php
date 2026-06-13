<?php

namespace App\Listeners;

use App\Events\eWalletEvents;
use App\Models\Notification;
use App\Models\Order;
use App\Services\AuditService;
use Illuminate\Support\Str;

class eWalletWebhookListener
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handles the incoming webhook from Xendit API.
     *
     * This method processes webhook notifications sent by Xendit API. The data received from the webhook
     * is expected to be an array, containing relevant information from the API response. This method
     * serves as a central point to implement various related tasks such as:
     *
     * - Saving transactional data or updates to the database.
     * - Triggering additional processes based on the webhook data (e.g., email notifications).
     * - Interacting with other internal or external APIs based on the received data.
     * - Performing validations and logging for audit or debugging purposes.
     *
     * It's crucial to ensure that this method handles the data securely and efficiently, maintaining
     * the integrity and performance of the application.
     */
    public function handle(eWalletEvents $event)
    {
        $data = $event->webhook_data;
        logger('Webhook data received: ', $data);

        $status = $data['data']['status'] ?? $data['status'] ?? null;
        $referenceId = $data['data']['reference_id'] ?? $data['reference_id'] ?? null;

        if ($status === 'SUCCEEDED' && $referenceId) {
            $order = Order::find($referenceId);
            if ($order) {
                $order->status = 'PENDING';
                $order->save();

                AuditService::updated('order', $order->id, [], ['status' => 'PENDING']);

                // Create a notification for the customer
                Notification::create([
                    'id' => Str::uuid(),
                    'customer_id' => $order->customer_id,
                    'title' => 'Payment Successful',
                    'message' => "Payment for Order {$order->id} was successfully received via GCash.",
                    'type' => 'success',
                    'is_read' => false,
                ]);

                logger("Order {$referenceId} status successfully updated to PENDING via eWallet webhook.");
            } else {
                logger("Order {$referenceId} not found for eWallet payment update.");
            }
        }
    }
}
