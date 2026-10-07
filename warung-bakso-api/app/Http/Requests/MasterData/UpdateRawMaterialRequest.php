<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRawMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('rawMaterial')->id;

        return [
            'code' => 'required|string|max:50|unique:raw_materials,code,' . $id,
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'stock' => 'nullable|numeric|min:0',
            'min_stock' => 'nullable|numeric|min:0',
            'price_per_unit' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
        ];
    }
}