<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'category',
        'selling_price',
        'stock',
        'image',
        'is_available',
    ];

    protected $casts = [
        'selling_price' => 'decimal:2',
        'stock' => 'decimal:3',
        'is_available' => 'boolean',
    ];

    // ✅ Accessor: $product->price akan otomatis mengambil dari selling_price
    public function getPriceAttribute()
    {
        return $this->selling_price;
    }

    public function recipeItems()
    {
        return $this->hasMany(RecipeItem::class);
    }

    public function transactionItems()
    {
        return $this->hasMany(TransactionItem::class);
    }
}