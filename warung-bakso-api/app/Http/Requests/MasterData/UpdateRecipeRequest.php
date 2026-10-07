<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRecipeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'yield_qty' => 'required|integer|min:1',
            'yield_unit' => 'required|string|max:50',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.raw_material_id' => 'required|exists:raw_materials,id',
            'items.*.qty' => 'required|numeric|min:0.001',
            'items.*.unit' => 'required|string|max:50',
        ];
    }
}