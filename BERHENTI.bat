@echo off
title Teras Abah - Mematikan Aplikasi
color 0C
chcp 65001 >nul

echo ========================================
echo   TERAS ABAH - Mematikan Aplikasi
echo ========================================
echo Sedang menghentikan service...

:: Matikan proses PHP (Laravel)
taskkill /F /IM php.exe 2>nul

:: Matikan browser (opsional, hapus baris ini jika tidak mau browser client tertutup paksa)
taskkill /F /IM chrome.exe 2>nul
taskkill /F /IM msedge.exe 2>nul

:: Matikan Laragon
taskkill /F /IM laragon.exe 2>nul
taskkill /F /IM httpd.exe 2>nul
taskkill /F /IM nginx.exe 2>nul
taskkill /F /IM mysqld.exe 2>nul

echo.
echo ========================================
echo   Aplikasi berhasil dimatikan!
echo ========================================
pause