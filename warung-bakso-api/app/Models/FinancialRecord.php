<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinancialRecord extends Model
{
    protected $fillable = [
        'reference_code',
        'category_id',
        'user_id',
        'shift_user_id',
        'type',
        'department',
        'description',
        'amount',
        'date',
        'attachment',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'date' => 'date',
        ];
    }

    /**
     * Relasi ke kategori
     */
    public function category()
    {
        return $this->belongsTo(FinancialCategory::class, 'category_id');
    }

    /**
     * Relasi ke user yang input
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi ke shift user (opsional)
     */
    public function shiftUser()
    {
        return $this->belongsTo(ShiftUser::class, 'shift_user_id');
    }
}