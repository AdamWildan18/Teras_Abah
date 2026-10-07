<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AddOn extends Model
{
    protected $table = 'add_ons';

    protected $fillable = [
        'code',
        'name',
        'price',
        'stock',
        'recipe_yield',
        'is_available',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock' => 'decimal:2',
        'recipe_yield' => 'integer',
        'is_available' => 'boolean',
    ];

    // Relationships
    public function recipeItems(): HasMany
    {
        return $this->hasMany(AddonRecipeItem::class, 'add_on_id');
    }

    public function productionBatches(): HasMany
    {
        return $this->hasMany(AddonProductionBatch::class, 'add_on_id');
    }
}