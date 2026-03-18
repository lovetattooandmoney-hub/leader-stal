@echo off
setlocal

cd /d "%~dp0"

set PORT=8000
set URL=http://localhost:%PORT%/

where python >nul 2>nul
if errorlevel 1 (
  echo Python не найден. Установите Python 3 и повторите.
  echo Затем запустите снова этот файл.
  pause
  exit /b 1
)

echo Запускаю локальный сервер: %URL%
start "Local server" cmd /c "python -m http.server %PORT%"

rem Небольшая пауза, чтобы сервер успел подняться
timeout /t 1 /nobreak >nul

start "" "%URL%"

echo Готово. Окно сервера можно не закрывать, пока работает сайт.
echo Для остановки сервера закройте окно "Local server".
pause

