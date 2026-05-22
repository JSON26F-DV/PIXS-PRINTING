<?php

namespace Database\Seeders;

use App\Models\DeliveryMethod;
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
            ],
            [
                'id' => 'del_002',
                'name' => 'J&T Express',
            ],
            [
                'id' => 'del_003',
                'name' => 'Store Pickup/Self-Book',
            ],
        ];

        foreach ($methods as $method) {
            DeliveryMethod::updateOrCreate(['id' => $method['id']], $method);
        }
    }
}
