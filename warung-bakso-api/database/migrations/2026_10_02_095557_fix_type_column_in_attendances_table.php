<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Ubah kolom type menjadi VARCHAR sementara untuk menghindari error ENUM
        DB::statement("ALTER TABLE `attendances` MODIFY COLUMN `type` VARCHAR(20) NOT NULL DEFAULT 'check_in'");
        
        // Update data yang sudah ada (jika ada)
        DB::table('attendances')->where('type', 'in')->update(['type' => 'check_in']);
        DB::table('attendances')->where('type', 'out')->update(['type' => 'check_out']);
        DB::table('attendances')->where('type', 'masuk')->update(['type' => 'check_in']);
        DB::table('attendances')->where('type', 'keluar')->update(['type' => 'check_out']);
        
        // Kembalikan ke ENUM dengan nilai yang benar
        DB::statement("ALTER TABLE `attendances` MODIFY COLUMN `type` ENUM('check_in','check_out') NOT NULL DEFAULT 'check_in'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE `attendances` MODIFY COLUMN `type` ENUM('in','out') NOT NULL DEFAULT 'in'");
    }
};