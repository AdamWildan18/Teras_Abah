<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RawMaterial extends Model
{
    protected $table = 'raw_materials';

    // ✅ PASTIKAN SEMUA FIELD ADA DI SINI
    protected $fillable = [
        'code',
        'name',
        'unit',
        'stock',
        'min_stock',       // ✅ Ini yang sering terlupa!
        'price_per_unit',
        'is_available',
        'description',
    ];

    // ✅ Casting tipe data agar aman
    protected $casts = [
        'stock' => 'decimal:3',
        'min_stock' => 'decimal:3',
        'price_per_unit' => 'decimal:2',
        'is_available' => 'boolean',
    ];
}