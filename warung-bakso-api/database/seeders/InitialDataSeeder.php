<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\FinancialCategory;
use App\Models\Shift;
use Illuminate\Support\Facades\Hash;

class InitialDataSeeder extends Seeder
{
    public function run(): void
    {
        // === ROLES ===
        $admin = Role::create([
            'name' => 'admin',
            'description' => 'Administrator',
        ]);

        $produksi = Role::create([
            'name' => 'produksi',
            'description' => 'Tim Produksi',
        ]);

        $kasir = Role::create([
            'name' => 'kasir',
            'description' => 'Kasir',
        ]);

        // === USERS ===
        $adminUser = User::create([
            'name' => 'Admin',
            'email' => 'admin@warung.com',
            'password' => Hash::make('password'),
        ]);
        $adminUser->roles()->attach($admin->id);

        $kasirUser = User::create([
            'name' => 'Kasir 1',
            'email' => 'kasir@warung.com',
            'password' => Hash::make('password'),
        ]);
        $kasirUser->roles()->attach($kasir->id);

        $produksiUser = User::create([
            'name' => 'Produksi 1',
            'email' => 'produksi@warung.com',
            'password' => Hash::make('password'),
        ]);
        $produksiUser->roles()->attach($produksi->id);

        // === SHIFTS ===
        Shift::create([
            'name' => 'Pagi',
            'start_time' => '06:00:00',
            'end_time' => '14:00:00',
            'is_active' => true,
        ]);

        Shift::create([
            'name' => 'Siang',
            'start_time' => '14:00:00',
            'end_time' => '22:00:00',
            'is_active' => true,
        ]);

        Shift::create([
            'name' => 'Malam',
            'start_time' => '22:00:00',
            'end_time' => '06:00:00',
            'is_active' => true,
        ]);

        // === FINANCIAL CATEGORIES ===
        FinancialCategory::create([
            'name' => 'Penjualan Menu',
            'type' => 'income',
            'department' => 'kasir',
        ]);

        FinancialCategory::create([
            'name' => 'Pembelian Bahan Mentah',
            'type' => 'expense',
            'department' => 'produksi',
        ]);

        FinancialCategory::create([
            'name' => 'Gaji Karyawan',
            'type' => 'expense',
            'department' => 'general',
        ]);

        FinancialCategory::create([
            'name' => 'Listrik & Air',
            'type' => 'expense',
            'department' => 'general',
        ]);

        $this->command->info('✅ Initial data seeded successfully!');
    }
}