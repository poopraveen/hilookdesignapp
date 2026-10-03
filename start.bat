@echo off
title HiLook Design - local server
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is not installed. Opening the download page...
  echo Install the LTS version, then double-click start.bat again.
  start https://nodejs.org/en/download
  pause
  exit /b 1
)
echo Node.js found:
node -v
if not exist node_modules (
  echo.
  echo Installing packages - first run only, takes 1-2 minutes...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo npm install failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)
echo.
echo Starting HiLook Design at http://localhost:3000
echo Keep this window open. Close it to stop the app.
start "" cmd /c "timeout /t 8 >nul & start http://localhost:3000"
call npm run dev
pause
