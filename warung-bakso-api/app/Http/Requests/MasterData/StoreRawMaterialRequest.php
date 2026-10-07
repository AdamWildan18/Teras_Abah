<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;

class StoreRawMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => 'required|string|max:50|unique:raw_materials,code',
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'stock' => 'nullable|numeric|min:0',
            'min_stock' => 'nullable|numeric|min:0',
            'price_per_unit' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Kode bahan wajib diisi.',
            'code.unique' => 'Kode bahan sudah digunakan.',
            'name.required' => 'Nama bahan wajib diisi.',
            'unit.required' => 'Satuan wajib diisi.',
        ];
    }
}