<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DeliveryMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $methods = [
            [
                'id' => 'del_001',
                'name' => 'Lalamove',
                'type' => 'courier',
                'fee' => 0,
                'note' => 'Customer will book and pay the courier directly upon pickup.',
            ],
            [
                'id' => 'del_002',
                'name' => 'J&T Express',
                'type' => 'courier',
                'fee' => 0,
                'note' => 'Shipping fee will be paid by the customer upon delivery (Cash on Delivery for SF).',
            ],
            [
                'id' => 'del_003',
                'name' => 'Store Pickup/Self-Book',
                'type' => 'pickup',
                'fee' => 0,
                'note' => 'Pick up your order directly from our production hub.',
            ]
        ];

        foreach ($methods as $method) {
            \App\Models\DeliveryMethod::updateOrCreate(['id' => $method['id']], $method);
        }
    }
}
