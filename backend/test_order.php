<?php
// Bootstrap Laravel
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\OrderController;
use App\Models\Customer;
use App\Models\CartItem;

$user = Customer::first();
if (!$user) {
    die("No user found.\n");
}

$cartItem = CartItem::where('customer_id', $user->id)->first();
if (!$cartItem) {
    die("No cart items found.\n");
}

$request = Request::create('/api/orders', 'POST', [
    'cart_item_ids' => [$cartItem->id],
    'address_id' => '1',
    'payment_method_id' => '1',
    'delivery_method_id' => 'del_001',
    'production_notes' => 'test notes',
]);
$request->setUserResolver(function () use ($user) { return $user; });

$controller = new OrderController();
try {
    $response = $controller->store($request);
    echo "Response Code: " . $response->getStatusCode() . "\n";
    echo "Response Content: " . $response->getContent() . "\n";
} catch (\Illuminate\Validation\ValidationException $e) {
    echo "Validation Error: " . json_encode($e->errors()) . "\n";
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine() . "\n";
}
