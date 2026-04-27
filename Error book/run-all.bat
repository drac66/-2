@echo off
setlocal

REM Error Book one-click launcher (Windows)
REM 1) start mock API
REM 2) start Java desktop app
REM 3) print Flutter mobile run instructions

set ROOT=%~dp0

echo [1/3] Starting mock API...
start "ErrorBook API" cmd /k "cd /d "%ROOT%backend\mock-api" && node server.js"

echo [2/3] Starting Java desktop app...
start "ErrorBook Desktop Java" cmd /k "cd /d "%ROOT%apps\desktop_java" && run.bat"

echo [3/3] Mobile app (Flutter) manual run:
echo     cd /d "%ROOT%apps\mobile_flutter"
echo     flutter pub get
echo     flutter run

echo.
echo Done. API + Desktop launched in separate windows.
