<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            [
                'code' => 'PBK',
                'name' => 'Paket Bakso Kriwil',
                'category' => 'bakso',
                'selling_price' => 15000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
            [
                'code' => 'PBC',
                'name' => 'Paket Bakso Cincang',
                'category' => 'bakso',
                'selling_price' => 15000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
            [
                'code' => 'PBT',
                'name' => 'Paket Bakso Telor',
                'category' => 'bakso',
                'selling_price' => 15000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
            [
                'code' => 'PBKU',
                'name' => 'Paket Bakso Keju',
                'category' => 'bakso',
                'selling_price' => 10000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
            [
                'code' => 'PBKL',
                'name' => 'Paket Bakso Kecil',
                'category' => 'bakso',
                'selling_price' => 10000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
            [
                'code' => 'PBI',
                'name' => 'Paket Bakso Iga',
                'category' => 'bakso',
                'selling_price' => 25000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
            [
                'code' => 'PALH',
                'name' => 'Paket Misdasem',
                'category' => 'bakso',
                'selling_price' => 15000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
            [
                'code' => 'MKB',
                'name' => 'Mie Kocok Biasa',
                'category' => 'mie',
                'selling_price' => 15000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
            [
                'code' => 'MKS',
                'name' => 'Mie Kocok Special',
                'category' => 'mie',
                'selling_price' => 25000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
            [
                'code' => 'MBM',
                'name' => 'Mie Bakmie',
                'category' => 'bakso',
                'selling_price' => 10000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
            [
                'code' => 'MJ',
                'name' => 'Mie Jebew',
                'category' => 'mie',
                'selling_price' => 10000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
            [
                'code' => 'MYA',
                'name' => 'Mie Yamin Asi',
                'category' => 'mie',
                'selling_price' => 10000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
            [
                'code' => 'MYM',
                'name' => 'Mie Yamin Manis',
                'category' => 'mie',
                'selling_price' => 10000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
            [
                'code' => 'MAB',
                'name' => 'Mie Ayam Biasa',
                'category' => 'mie',
                'selling_price' => 15000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
            [
                'code' => 'MAS',
                'name' => 'Mie Ayam Special',
                'category' => 'mie',
                'selling_price' => 20000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
            [
                'code' => 'J',
                'name' => 'Jewol',
                'category' => 'bakso',
                'selling_price' => 10000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
            [
                'code' => 'PK',
                'name' => 'Pangsit Kuah',
                'category' => 'lainnya',
                'selling_price' => 10000.00,
                'stock' => 0.000,
                'is_available' => true,
            ],
        ];

        // Masukkan data ke database. Laravel akan otomatis mengisi created_at dan updated_at
        foreach ($products as $product) {
            Product::updateOrCreate(
                ['code' => $product['code']], // Cek berdasarkan kode unik
                $product // Data yang akan di-insert atau di-update
            );
        }
    }
}