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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->morphs('stockable'); // raw_material atau product
            $table->enum('type', ['in', 'out', 'adjustment']);
            $table->decimal('qty', 15, 3);
            $table->string('reference_type')->nullable(); // production_batch, transaction, purchase
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->foreignId('user_id')->constrained();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
