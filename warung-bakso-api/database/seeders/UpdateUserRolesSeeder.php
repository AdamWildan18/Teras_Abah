<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UpdateUserRolesSeeder extends Seeder
{
    public function run(): void
    {
        // 1. ADMIN (Gunakan updateOrCreate & tambahkan password)
        User::updateOrCreate(
            ['email' => 'admin@warung.com'],
            [
                'name' => 'Admin Utama',
                'password' => bcrypt('password'), // ← PENTING: Password diatur di sini
                'role' => 'admin',
                'is_active' => true,
            ]
        );

        // 2. KASIR
        User::updateOrCreate(
            ['email' => 'kasir@warung.com'],
            [
                'name' => 'Budi Kasir',
                'password' => bcrypt('password'),
                'role' => 'kasir',
                'is_active' => true,
            ]
        );

        // 3. PRODUKSI
        User::updateOrCreate(
            ['email' => 'produksi@warung.com'],
            [
                'name' => 'Siti Produksi',
                'password' => bcrypt('password'),
                'role' => 'produksi',
                'is_active' => true,
            ]
        );

        // 4. OWNER
        User::updateOrCreate(
            ['email' => 'owner@warung.com'],
            [
                'name' => 'Pak Owner',
                'password' => bcrypt('password'),
                'role' => 'owner',
                'is_active' => true,
            ]
        );
    }
}