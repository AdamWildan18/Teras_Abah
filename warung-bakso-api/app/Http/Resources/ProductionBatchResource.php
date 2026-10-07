<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductionBatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'batch_code' => $this->batch_code,
            'product' => [
                'id' => $this->product->id,
                'code' => $this->product->code,
                'name' => $this->product->name,
            ],
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ],
            'qty_produced' => $this->qty_produced,
            'production_date' => $this->production_date?->format('Y-m-d'),
            'total_cost' => (float) $this->total_cost,
            'status' => $this->status,
            'notes' => $this->notes,
            'batch_items' => $this->whenLoaded('batchItems', fn() => 
                $this->batchItems->map(fn($item) => [
                    'id' => $item->id,
                    'raw_material' => [
                        'id' => $item->rawMaterial->id,
                        'code' => $item->rawMaterial->code,
                        'name' => $item->rawMaterial->name,
                    ],
                    'qty_used' => (float) $item->qty_used,
                    'unit' => $item->unit,
                ])
            ),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}