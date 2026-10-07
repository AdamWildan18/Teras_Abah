<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('product')->id;

        return [
            'code' => 'required|string|max:50|unique:products,code,' . $id,
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'selling_price' => 'required|numeric|min:0',
            'stock' => 'nullable|numeric|min:0',
            'image' => 'nullable|image|max:2048',
            'is_available' => 'boolean',
        ];
    }
}