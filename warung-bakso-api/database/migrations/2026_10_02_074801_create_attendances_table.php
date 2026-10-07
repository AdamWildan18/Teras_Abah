<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['hadir', 'izin', 'sakit', 'cuti', 'alpha'])->default('hadir');
            $table->enum('type', ['manual', 'scan'])->default('manual'); // manual = admin input, scan = QR scan
            $table->time('check_in')->nullable();
            $table->time('check_out')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('input_by')->nullable()->constrained('users')->onDelete('set null'); // Admin yang input (jika manual)
            $table->timestamps();
            
            // Unique: 1 attendance per user per hari
            $table->unique(['date', 'user_id']);
            
            // Index untuk query cepat
            $table->index(['date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};