<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AddonRecipeItem extends Model
{
    protected $table = 'addon_recipe_items';

    protected $fillable = [
        'add_on_id',
        'raw_material_id',
        'qty',
        'unit',
    ];

    protected $casts = [
        'qty' => 'decimal:3',
    ];

    public function addOn(): BelongsTo
    {
        return $this->belongsTo(AddOn::class, 'add_on_id');
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class, 'raw_material_id');
    }
}