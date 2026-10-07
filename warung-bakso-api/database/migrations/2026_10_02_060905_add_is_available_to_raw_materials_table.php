   <?php

   use Illuminate\Database\Migrations\Migration;
   use Illuminate\Database\Schema\Blueprint;
   use Illuminate\Support\Facades\Schema;

   return new class extends Migration
   {
       public function up(): void
       {
           Schema::table('raw_materials', function (Blueprint $table) {
               if (!Schema::hasColumn('raw_materials', 'is_available')) {
                   $table->boolean('is_available')->default(true)->after('price_per_unit');
               }
           });
       }

       public function down(): void
       {
           Schema::table('raw_materials', function (Blueprint $table) {
               $table->dropColumn('is_available');
           });
       }
   };