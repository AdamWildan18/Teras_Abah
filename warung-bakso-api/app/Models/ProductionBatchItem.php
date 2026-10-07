<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionBatchItem extends Model
{
    protected $fillable = [
        'production_batch_id',
        'raw_material_id',
        'qty_used',
        'unit',
    ];

    protected function casts(): array
    {
        return [
            'qty_used' => 'decimal:3',
        ];
    }

    public function batch()
    {
        return $this->belongsTo(ProductionBatch::class, 'production_batch_id');
    }

    public function rawMaterial()
    {
        return $this->belongsTo(RawMaterial::class);
    }
}