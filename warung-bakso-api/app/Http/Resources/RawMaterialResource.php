<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RawMaterialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'unit' => $this->unit,
            'stock' => (float) $this->stock,
            'min_stock' => (float) $this->min_stock,
            'price_per_unit' => (float) $this->price_per_unit,
            'description' => $this->description,
            'is_low_stock' => $this->stock <= $this->min_stock,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}