<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => 'required|string|max:50|unique:products,code',
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'selling_price' => 'required|numeric|min:0',
            'stock' => 'nullable|numeric|min:0',
            'image' => 'nullable|image|max:2048',
            'is_available' => 'boolean',
        ];
    }
}