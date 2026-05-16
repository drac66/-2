@echo off
setlocal

REM Error Book one-click launcher (Windows)
REM 1) start Java desktop app in offline JSON mode
REM 2) print Flutter mobile run/build instructions

set ROOT=%~dp0

echo [1/2] Starting Java desktop app in offline mode...
start "ErrorBook Desktop Java" cmd /k "cd /d ""%ROOT%apps\desktop_java"" && run.bat"

echo [2/2] Mobile app (Flutter) manual commands:
echo     cd /d "%ROOT%apps\mobile_flutter"
echo     flutter pub get
echo     flutter run
echo     flutter build apk --release

echo.
echo Done. Desktop launched in a separate window. Mock API is optional under backend\mock-api.
