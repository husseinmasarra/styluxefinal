@echo off
title STYLUXE LUXURY BOUTIQUE
chcp 65001 >nul

echo ========================================================
echo        STYLUXE LUXURY BOUTIQUE - خادم المتجر
echo ========================================================
echo.
echo [*] جاري تشغيل المتجر على الرابط: http://localhost:3000
echo [*] سيتم فتح المتصفح تلقائياً...
echo.

start "" http://localhost:3000

if exist "C:\Program Files\nodejs\node.exe" (
    "C:\Program Files\nodejs\node.exe" "node_modules\next\dist\bin\next" dev -p 3000
) else (
    node "node_modules\next\dist\bin\next" dev -p 3000
)

pause
