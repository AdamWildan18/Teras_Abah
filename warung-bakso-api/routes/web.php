<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

// Route ini akan menangkap semua permintaan dan mengarahkannya ke file index.html (React)
Route::get('/{any?}', function () {
    $indexPath = public_path('index.html');
    if (File::exists($indexPath)) {
        return response()->file($indexPath);
    }
    return response('Frontend belum di-build. Jalankan "npm run build" di folder frontend.', 404);
})->where('any', '.*');