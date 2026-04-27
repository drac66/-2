@echo off
setlocal

if not exist out (
  mkdir out
)

javac -encoding UTF-8 -d out src\main\java\com\errorbook\app\Main.java src\main\java\com\errorbook\app\model\Mistake.java src\main\java\com\errorbook\app\repository\MistakeRepository.java src\main\java\com\errorbook\app\repository\HttpMistakeRepository.java src\main\java\com\errorbook\app\ui\DesktopFrame.java src\main\java\com\errorbook\app\ui\MistakeDialog.java
if %ERRORLEVEL% neq 0 (
  echo Compile failed.
  exit /b %ERRORLEVEL%
)

java -cp out com.errorbook.app.Main
