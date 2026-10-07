<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'stockable_type',
        'stockable_id',
        'type',
        'qty',
        'reference_type',
        'reference_id',
        'user_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'qty' => 'decimal:3',
        ];
    }

    /**
     * Relasi polymorphic ke stockable (RawMaterial atau Product)
     */
    public function stockable()
    {
        return $this->morphTo();
    }

    /**
     * Relasi ke user yang melakukan
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}