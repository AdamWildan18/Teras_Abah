<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('reference_type')->nullable(); // 'production', 'operational', etc
            $table->unsignedBigInteger('reference_id')->nullable(); // ID dari production batch
            $table->string('category'); // 'bahan_baku', 'operasional', 'gaji', 'lainnya'
            $table->string('description');
            $table->decimal('amount', 15, 2);
            $table->date('expense_date');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('expenses');
    }
};