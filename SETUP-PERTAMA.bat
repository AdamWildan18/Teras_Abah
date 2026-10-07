@echo off
title Teras Abah - Setup Database
color 0B
chcp 65001 >nul

echo ========================================
echo   TERAS ABAH - Setup Pertama Kali
echo ========================================
echo Memastikan database siap...

:: Masuk ke folder Laravel
cd /d D:\Project\Website\teras-abah\warung-bakso\warung-bakso-api

:: Generate key jika belum ada
php artisan key:generate --force

:: Jalankan migrasi dan seeder
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link

echo.
echo ========================================
echo   Setup Selesai! 
echo   Sekarang Anda bisa menjalankan MULAI.bat
echo ========================================
pause