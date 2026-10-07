<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AddonProductionBatch extends Model
{
    protected $table = 'addon_production_batches';

    protected $fillable = [
        'batch_code',
        'add_on_id',
        'user_id',
        'qty_produced',
        'total_cost',
        'production_date',
        'notes',
        'status',
    ];

    protected $casts = [
        'qty_produced' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'production_date' => 'date',
    ];

    public function addOn(): BelongsTo
    {
        return $this->belongsTo(AddOn::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function batchItems(): HasMany
    {
        return $this->hasMany(AddonProductionBatchItem::class, 'addon_production_batch_id');
    }
}