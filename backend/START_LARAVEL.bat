@echo off
title STYLUXE LARAVEL REST API
chcp 65001 >nul

echo ========================================================
echo       STYLUXE LARAVEL 11 REST API - تشغيل الخادم
echo ========================================================
echo.
echo [*] جاري تشغيل خادم لارفل على: http://localhost:8000
echo.

php artisan serve --port=8000

pause
