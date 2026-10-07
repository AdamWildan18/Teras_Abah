<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'category' => $this->category,
            'selling_price' => (float) $this->selling_price,
            'stock' => (float) $this->stock,
            'image' => $this->image,
            'is_available' => $this->is_available,
            'recipe' => $this->whenLoaded('recipe', function() {
                return [
                    'id' => $this->recipe->id,
                    'yield_qty' => $this->recipe->yield_qty,
                    'yield_unit' => $this->recipe->yield_unit,
                    'items' => $this->recipe->recipeItems->map(fn($item) => [
                        'raw_material_id' => $item->raw_material_id,
                        'raw_material_name' => $item->rawMaterial->name,
                        'qty' => (float) $item->qty,
                        'unit' => $item->unit,
                    ]),
                ];
            }),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}