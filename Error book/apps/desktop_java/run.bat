@echo off
setlocal

if not exist out (
  mkdir out
)

javac -d out src\main\java\com\errorbook\app\Main.java src\main\java\com\errorbook\app\ui\DesktopFrame.java
if %ERRORLEVEL% neq 0 (
  echo Compile failed.
  exit /b %ERRORLEVEL%
)

java -cp out com.errorbook.app.Main
