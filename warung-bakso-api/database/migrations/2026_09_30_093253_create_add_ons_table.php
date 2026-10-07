<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('add_ons', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Contoh: "Tetelan", "Pangsit", "Kerupuk"
            $table->decimal('price', 10, 2); // Harga add-on
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('add_ons');
    }
};