@echo off
chcp 65001 > nul
echo ===================================================
echo   STYLUXE - Pushing Updates to GitHub & Vercel
echo ===================================================
cd /d "%~dp0"
"C:\Users\Hussein\AppData\Local\GitHubDesktop\app-3.6.5\resources\app\git\cmd\git.exe" push origin main
echo.
echo ===================================================
echo   Done! Check https://styluxefinal.vercel.app
echo ===================================================
pause
