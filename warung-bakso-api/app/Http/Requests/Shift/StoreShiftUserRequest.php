<?php

namespace App\Http\Requests\Shift;

use Illuminate\Foundation\Http\FormRequest;

class StoreShiftUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'shift_id' => 'required|exists:shifts,id',
            'date' => 'required|date',
            'cash_start' => 'nullable|numeric|min:0',
        ];
    }
}