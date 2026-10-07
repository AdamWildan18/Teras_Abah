<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecipeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product' => [
                'id' => $this->product->id,
                'code' => $this->product->code,
                'name' => $this->product->name,
            ],
            'yield_qty' => $this->yield_qty,
            'yield_unit' => $this->yield_unit,
            'notes' => $this->notes,
            'items' => $this->recipeItems->map(fn($item) => [
                'id' => $item->id,
                'raw_material_id' => $item->raw_material_id,
                'raw_material' => [
                    'id' => $item->rawMaterial->id,
                    'code' => $item->rawMaterial->code,
                    'name' => $item->rawMaterial->name,
                    'unit' => $item->rawMaterial->unit,
                    'stock' => (float) $item->rawMaterial->stock,
                ],
                'qty' => (float) $item->qty,
                'unit' => $item->unit,
            ]),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}