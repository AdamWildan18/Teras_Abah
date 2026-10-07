<?php

namespace App\Http\Requests\Cashier;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:255',
            'items.*.add_ons' => 'nullable|array',
            'items.*.add_ons.*.id' => 'nullable|integer',
            'items.*.add_ons.*.name' => 'nullable|string|max:255',
            'items.*.add_ons.*.price' => 'nullable|numeric|min:0',
            
            'customer_name' => 'nullable|string|max:255',
            'order_type' => 'required|in:dine_in,take_away,delivery',
            'payment_method' => 'required|in:cash,qris,transfer,debit',
            'paid' => 'required|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'total' => 'required|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Keranjang tidak boleh kosong',
            'items.*.product_id.exists' => 'Produk tidak valid',
            'items.*.qty.min' => 'Jumlah minimal 1',
            'paid.min' => 'Uang pembayaran tidak valid',
        ];
    }
}