<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'invoice_number',
        'shift_user_id',
        'cashier_id',
        'customer_name',
        'order_type',
        'subtotal',
        'discount_percent',
        'discount_amount',  
        'discount',
        'tax',
        'total',
        'paid',
        'change',
        'payment_method',
        'status',
        'transacted_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount_percent' => 'decimal:2',
            'discount' => 'decimal:2',
            'tax' => 'decimal:2',
            'total' => 'decimal:2',
            'paid' => 'decimal:2',
            'change' => 'decimal:2',
            'transacted_at' => 'datetime',
        ];
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function shiftUser()
    {
        return $this->belongsTo(ShiftUser::class);
    }

    public function items()
    {
        return $this->hasMany(TransactionItem::class);
    }
}