<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionBatch extends Model
{
    protected $fillable = [
        'batch_code',
        'product_id',
        'user_id',
        'qty_produced',
        'production_date',
        'notes',
        'status',
        'total_cost',
    ];

    protected function casts(): array
    {
        return [
            'qty_produced' => 'integer',
            'production_date' => 'date',
            'total_cost' => 'decimal:2',
        ];
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function batchItems()
    {
        return $this->hasMany(ProductionBatchItem::class);
    }
}