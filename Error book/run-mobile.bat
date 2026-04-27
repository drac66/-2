@echo off
setlocal

set ROOT=%~dp0
cd /d "%ROOT%apps\mobile_flutter"

echo Running flutter pub get...
flutter pub get
if %ERRORLEVEL% neq 0 (
  echo flutter pub get failed.
  exit /b %ERRORLEVEL%
)

echo Starting Flutter app...
flutter run
