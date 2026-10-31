@echo off
chcp 65001 > nul
echo ===================================================
echo   STYLUXE - Pushing Updates to GitHub & Vercel
echo ===================================================
cd /d "%~dp0"

set "GIT_EXE="
if exist "C:\Users\Hussein\AppData\Local\GitHubDesktop\app-3.6.6\resources\app\git\cmd\git.exe" (
    set "GIT_EXE=C:\Users\Hussein\AppData\Local\GitHubDesktop\app-3.6.6\resources\app\git\cmd\git.exe"
) else if exist "C:\Users\Hussein\AppData\Local\GitHubDesktop\app-3.6.5\resources\app\git\cmd\git.exe" (
    set "GIT_EXE=C:\Users\Hussein\AppData\Local\GitHubDesktop\app-3.6.5\resources\app\git\cmd\git.exe"
) else (
    set "GIT_EXE=git"
)

echo [*] Staging changes...
"%GIT_EXE%" add .

echo [*] Committing changes...
"%GIT_EXE%" commit -m "Update Styluxe store"

echo [*] Pushing to GitHub & Vercel...
"%GIT_EXE%" push origin main

echo.
echo ===================================================
echo   Done! Check https://www.styluxelb.com
echo ===================================================
pause
