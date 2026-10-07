<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AddonProductionBatchItem extends Model
{
    protected $table = 'addon_production_batch_items';

    protected $fillable = [
        'addon_production_batch_id',
        'raw_material_id',
        'qty_used',
        'unit',
        'cost',
    ];

    protected $casts = [
        'qty_used' => 'decimal:3',
        'cost' => 'decimal:2',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(AddonProductionBatch::class, 'addon_production_batch_id');
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }
}