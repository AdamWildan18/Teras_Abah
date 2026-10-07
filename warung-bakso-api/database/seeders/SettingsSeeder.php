<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // General
            ['key' => 'app_name', 'value' => 'Warung Bakso', 'type' => 'string', 'group' => 'general', 'description' => 'Nama aplikasi'],
            ['key' => 'app_tagline', 'value' => 'Sistem Manajemen Terintegrasi', 'type' => 'string', 'group' => 'general', 'description' => 'Tagline aplikasi'],
            ['key' => 'app_logo', 'value' => null, 'type' => 'file', 'group' => 'general', 'description' => 'Logo aplikasi (path file)'],
            ['key' => 'app_favicon', 'value' => null, 'type' => 'file', 'group' => 'general', 'description' => 'Favicon aplikasi'],
            
            // Business Info (untuk struk)
            ['key' => 'business_name', 'value' => 'WARUNG BAKSO', 'type' => 'string', 'group' => 'receipt', 'description' => 'Nama usaha (untuk struk)'],
            ['key' => 'business_address', 'value' => 'Jl. Contoh No. 123, Jakarta', 'type' => 'string', 'group' => 'receipt', 'description' => 'Alamat usaha'],
            ['key' => 'business_phone', 'value' => '0812-3456-7890', 'type' => 'string', 'group' => 'receipt', 'description' => 'Nomor telepon'],
            ['key' => 'business_footer', 'value' => 'Terima kasih atas kunjungan Anda!', 'type' => 'string', 'group' => 'receipt', 'description' => 'Pesan footer struk'],
            
            // Receipt Settings
            ['key' => 'receipt_paper_size', 'value' => '80mm', 'type' => 'string', 'group' => 'receipt', 'description' => 'Ukuran kertas struk (58mm/80mm)'],
            ['key' => 'receipt_show_logo', 'value' => 'true', 'type' => 'boolean', 'group' => 'receipt', 'description' => 'Tampilkan logo di struk'],
            ['key' => 'receipt_show_timestamp', 'value' => 'true', 'type' => 'boolean', 'group' => 'receipt', 'description' => 'Tampilkan tanggal/waktu di struk'],
            ['key' => 'receipt_auto_print', 'value' => 'false', 'type' => 'boolean', 'group' => 'receipt', 'description' => 'Auto print setelah transaksi'],
            
            // Appearance
            ['key' => 'theme_mode', 'value' => 'light', 'type' => 'string', 'group' => 'appearance', 'description' => 'Mode tema (light/dark)'],
            ['key' => 'primary_color', 'value' => '#f59e0b', 'type' => 'string', 'group' => 'appearance', 'description' => 'Warna utama aplikasi'],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}