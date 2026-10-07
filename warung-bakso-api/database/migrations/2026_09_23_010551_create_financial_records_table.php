<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('financial_records', function (Blueprint $table) {
            $table->id();
            $table->string('reference_code')->nullable(); // link ke transaksi/batch
            $table->foreignId('category_id')->constrained('financial_categories');
            $table->foreignId('user_id')->constrained(); // yang input
            $table->foreignId('shift_user_id')->nullable()->constrained();
            $table->enum('type', ['income', 'expense']);
            $table->enum('department', ['produksi', 'kasir', 'general']);
            $table->string('description');
            $table->decimal('amount', 15, 2);
            $table->date('date');
            $table->string('attachment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_records');
    }
};
