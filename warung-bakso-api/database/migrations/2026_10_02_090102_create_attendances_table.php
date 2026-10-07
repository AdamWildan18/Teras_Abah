<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('attendances')) {
            Schema::create('attendances', function (Blueprint $table) {
                $table->id();
                $table->date('date');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->enum('status', ['hadir', 'izin', 'sakit', 'cuti', 'alpha'])->default('hadir');
                $table->enum('type', ['check_in', 'check_out'])->default('check_in');
                $table->time('time')->nullable();
                $table->enum('method', ['manual', 'scan'])->default('manual');
                $table->text('notes')->nullable();
                $table->foreignId('input_by')->nullable()->constrained('users')->onDelete('set null');
                $table->timestamps();
                
                $table->unique(['date', 'user_id', 'type']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};