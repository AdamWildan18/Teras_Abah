<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update tabel add_ons (Aman: hanya tambah jika kolom belum ada)
        Schema::table('add_ons', function (Blueprint $table) {
            if (!Schema::hasColumn('add_ons', 'code')) {
                $table->string('code')->unique()->after('id');
            }
            if (!Schema::hasColumn('add_ons', 'stock')) {
                $table->decimal('stock', 10, 2)->default(0)->after('price');
            }
            if (!Schema::hasColumn('add_ons', 'recipe_yield')) {
                $table->unsignedBigInteger('recipe_yield')->default(1)->after('stock');
            }
        });

        // 2. Tabel resep add-on (bahan mentah yang dibutuhkan)
        if (!Schema::hasTable('addon_recipe_items')) {
            Schema::create('addon_recipe_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('add_on_id')->constrained('add_ons')->onDelete('cascade');
                $table->foreignId('raw_material_id')->constrained('raw_materials')->onDelete('cascade');
                $table->decimal('qty', 10, 3);
                $table->string('unit', 20);
                $table->timestamps();
            });
        }

        // 3. Tabel batch produksi add-on
        if (!Schema::hasTable('addon_production_batches')) {
            Schema::create('addon_production_batches', function (Blueprint $table) {
                $table->id();
                $table->string('batch_code')->unique();
                $table->foreignId('add_on_id')->constrained('add_ons')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->decimal('qty_produced', 10, 2);
                $table->decimal('total_cost', 15, 2)->default(0);
                $table->date('production_date');
                $table->text('notes')->nullable();
                $table->enum('status', ['completed', 'cancelled'])->default('completed');
                $table->timestamps();
            });
        }

        // 4. Tabel item batch produksi add-on (bahan yang dipakai)
        if (!Schema::hasTable('addon_production_batch_items')) {
            Schema::create('addon_production_batch_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('addon_production_batch_id')->constrained('addon_production_batches')->onDelete('cascade');
                $table->foreignId('raw_material_id')->constrained('raw_materials')->onDelete('cascade');
                $table->decimal('qty_used', 10, 3);
                $table->string('unit', 20);
                $table->decimal('cost', 15, 2)->default(0);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('addon_production_batch_items');
        Schema::dropIfExists('addon_production_batches');
        Schema::dropIfExists('addon_recipe_items');
        
        // Jangan drop kolom di add_ons saat rollback agar data tidak rusak, 
        // atau biarkan seperti ini jika Anda yakin ingin membersihkannya.
    }
};