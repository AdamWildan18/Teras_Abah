<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionItem extends Model
{
    protected $table = 'transaction_items';

    protected $fillable = [
        'transaction_id',
        'product_id',
        'product_name',
        'price',
        'qty',
        'subtotal',
        'notes',
        'add_ons',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'qty' => 'integer',
        'subtotal' => 'decimal:2',
        'add_ons' => 'array', // Auto cast JSON ke array
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}