<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftUser extends Model
{
    protected $fillable = [
        'user_id',
        'shift_id',
        'date',
        'clock_in',
        'clock_out',
        'cash_start',
        'cash_end',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'cash_start' => 'decimal:2',
            'cash_end' => 'decimal:2',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function records()
    {
        return $this->hasMany(FinancialRecord::class, 'shift_user_id');
    }
}