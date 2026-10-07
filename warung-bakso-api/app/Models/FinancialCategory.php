<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinancialCategory extends Model
{
    protected $fillable = [
        'name',
        'type',
        'department',
    ];

    public function records()
    {
        return $this->hasMany(FinancialRecord::class, 'category_id');
    }
}