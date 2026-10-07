<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    protected $fillable = [
        'product_id',
        'yield_qty',
        'yield_unit',
        'notes',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function recipeItems()
    {
        return $this->hasMany(RecipeItem::class);
    }
}