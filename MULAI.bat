@echo off
title Warung Bakso - Sistem Kasir
color 0A

echo ============================================
echo    WARUNG BAKSO - Sistem Kasir
echo ============================================
echo.
echo [1/2] Menjalankan Server Aplikasi...
cd /d "%~dp0warung-bakso-api"
start "Server Warung Bakso" cmd /k "php artisan serve --host=0.0.0.0 --port=8000"

echo.
echo [2/2] Membuka Aplikasi di Browser...
timeout /t 3 /nobreak >nul

:: Membuka browser dalam mode "App" (tanpa address bar & tab, seperti aplikasi desktop)
:: Ganti 'msedge.exe' dengan 'chrome.exe' jika Anda menggunakan Google Chrome
start msedge.exe --app=http://localhost:8000 --window-size=1280,800

echo.
echo ============================================
echo  [OK] Aplikasi siap digunakan!
echo  [!] Jendela hitam di belakang JANGAN ditutup
echo  ============================================
pause