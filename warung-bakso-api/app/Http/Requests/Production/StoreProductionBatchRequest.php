<?php

namespace App\Http\Requests\Production;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductionBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => 'required|exists:products,id',
            'qty_produced' => 'required|integer|min:1',
            'production_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'Produk wajib dipilih.',
            'qty_produced.required' => 'Jumlah produksi wajib diisi.',
            'qty_produced.min' => 'Jumlah produksi minimal 1.',
        ];
    }
}