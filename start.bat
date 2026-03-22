@echo off
setlocal

cd /d "%~dp0"

set PORT=8000
set URL=http://localhost:%PORT%/

where php >nul 2>nul
if not errorlevel 1 (
  echo Локальный сервер PHP: %URL%
  start "PHP server" cmd /c "php -S localhost:%PORT%"
  timeout /t 1 /nobreak >nul
  start "" "%URL%"
  echo Готово. Закройте окно "PHP server", чтобы остановить.
  pause
  exit /b 0
)

where python >nul 2>nul
if errorlevel 1 (
  echo Не найдены PHP и Python. Установите один из них.
  pause
  exit /b 1
)

echo Локальный сервер Python: %URL%
start "Local server" cmd /c "python -m http.server %PORT%"
timeout /t 1 /nobreak >nul
start "" "%URL%"
pause
