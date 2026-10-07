<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AddOn;

class AddOnSeeder extends Seeder
{
    public function run()
    {
        $addOns = [
            [
                'code' => 'AO01',
                'name' => 'Tetelan',
                'price' => 5000,
                'stock' => 0,
                'recipe_yield' => 1,
                'is_available' => true,
            ],
            [
                'code' => 'AO02',
                'name' => 'Cirawang',
                'price' => 5000,
                'stock' => 0,
                'recipe_yield' => 1,
                'is_available' => true,
            ],
            [
                'code' => 'AO03',
                'name' => 'Kikil',
                'price' => 5000,
                'stock' => 0,
                'recipe_yield' => 1,
                'is_available' => true,
            ],
            [
                'code' => 'AO04',
                'name' => 'Tahu Bakso',
                'price' => 3000,
                'stock' => 0,
                'recipe_yield' => 1,
                'is_available' => true,
            ],
            [
                'code' => 'AO05',
                'name' => 'Ceker',
                'price' => 5000,
                'stock' => 0,
                'recipe_yield' => 1,
                'is_available' => true,
            ],
            [
                'code' => 'AO06',
                'name' => 'Soun',
                'price' => 1000,
                'stock' => 0,
                'recipe_yield' => 1,
                'is_available' => true,
            ],
            [
                'code' => 'AO07',
                'name' => 'Sayur',
                'price' => 1000,
                'stock' => 0,
                'recipe_yield' => 1,
                'is_available' => true,
            ],
            [
                'code' => 'AO08',
                'name' => 'Toge',
                'price' => 1000,
                'stock' => 0,
                'recipe_yield' => 1,
                'is_available' => true,
            ],
            [
                'code' => 'AO09',
                'name' => 'Mie Kuning',
                'price' => 1000,
                'stock' => 0,
                'recipe_yield' => 1,
                'is_available' => true,
            ],
            [
                'code' => 'AO10',
                'name' => 'Bakso Kriwil',
                'price' => 10000,
                'stock' => 0,
                'recipe_yield' => 1,
                'is_available' => true,
            ],
            [
                'code' => 'AO11',
                'name' => 'Bakso Cincang',
                'price' => 10000,
                'stock' => 0,
                'recipe_yield' => 1,
                'is_available' => true,
            ],
            [
                'code' => 'AO12',
                'name' => 'Bakso Telur',
                'price' => 10000,
                'stock' => 0,
                'recipe_yield' => 1,
                'is_available' => true,
            ],
            [
                'code' => 'AO13',
                'name' => 'Bakso Keju',
                'price' => 10000,
                'stock' => 0,
                'recipe_yield' => 1,
                'is_available' => true,
            ],
            [
                'code' => 'AO14',
                'name' => 'Bakso Kecil',
                'price' => 10000,
                'stock' => 0,
                'recipe_yield' => 1,
                'is_available' => true,
            ],
        ];

        // Gunakan updateOrCreate agar tidak error jika data sudah ada (berdasarkan kode unik)
        foreach ($addOns as $addOn) {
            AddOn::updateOrCreate(
                ['code' => $addOn['code']], // Kondisi pencarian (unique)
                $addOn // Data yang akan di-insert atau di-update
            );
        }
    }
}