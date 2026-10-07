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
       Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('shift_user_id')->nullable()->constrained();
            $table->foreignId('cashier_id')->constrained('users');
            $table->string('customer_name')->nullable();
            $table->enum('order_type', ['dine_in', 'takeaway', 'delivery'])->default('dine_in');
            $table->decimal('subtotal', 15, 2);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('tax', 15, 2)->default(0);
            $table->decimal('total', 15, 2);
            $table->decimal('paid', 15, 2);
            $table->decimal('change', 15, 2)->default(0);
            $table->enum('payment_method', ['cash', 'qris', 'transfer', 'debit'])->default('cash');
            $table->enum('status', ['completed', 'voided'])->default('completed');
            $table->timestamp('transacted_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
