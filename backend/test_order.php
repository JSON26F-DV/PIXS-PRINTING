<?php

use App\Models\Order;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

$orders = Order::with([
    'items',
    'items.product',
    'items.variant',
    'items.colors.colorDetails',
    'items.screenplate',
])->orderBy('created_at', 'desc')->get();

$formatted = $orders->map(function ($order) {
    return [
        'order_id' => $order->id,
        'user_id' => $order->customer_id,
        'total_amount' => (float) $order->total_amount,
        'status' => $order->status,
        'created_at' => $order->created_at,
        'admin_comment' => $order->admin_comment,
        'feedback' => $order->feedback,
        'complaint' => $order->complaint,
        'rating' => $order->rating,
        'order_items' => $order->items->map(function ($item) use ($order) {
            $order_item_colors = $item->colors ? $item->colors->map(function ($c) {
                return [
                    'name' => $c->colorDetails ? $c->colorDetails->name : $c->color_id,
                    'hex' => $c->colorDetails ? $c->colorDetails->hex : '#000000',
                ];
            })->toArray() : [];

            $plate = $item->screenplate ? [
                'name' => $item->screenplate->plate_name ?? 'Custom Plate',
                'setupFee' => 0,
                'printPricePerUnit' => (float) $item->plate_price,
            ] : null;

            return [
                'id' => (string) $item->id,
                'product_id' => $item->product_id,
                'productName' => $item->product ? $item->product->name : 'Unknown Product',
                'productImage' => $item->product && $item->product->main_image
                    ? '/images/products/'.$item->product->main_image
                    : '',
                'quantity' => $item->quantity,
                'variant' => [
                    'size' => $item->variant ? $item->variant->size : '',
                    'unitPrice' => (float) $item->unit_price,
                ],
                'order_item_colors' => $order_item_colors,
                'plate' => $plate,
                'customRequirements' => clone $order->production_notes,
            ];
        })->toArray(),
    ];
});

echo json_encode($formatted);
