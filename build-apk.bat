@echo off
echo ===================================================
echo Building NBB Mobile Prototype Android APK...
echo ===================================================

if not exist "%~dp0Mobile\MobileApp\pubspec.yaml" (
  echo Flutter project missing. Creating...
  cd /d "%~dp0Mobile\MobileApp"
  call flutter create . --project-name nbb_mobile --org com.kalbe.nbb
  if %ERRORLEVEL% neq 0 (
    echo flutter create failed. Install Flutter SDK first.
    exit /b %ERRORLEVEL%
  )
)

echo [1/3] Syncing Views + wwwroot to Flutter assets...
node "%~dp0scripts\create-flutter-wrapper.js"
if %ERRORLEVEL% neq 0 (
  echo Error during syncing assets.
  exit /b %ERRORLEVEL%
)

echo [2/3] Ensuring main.dart WebView entry...
copy /Y "%~dp0Mobile\templates\main.dart" "%~dp0Mobile\MobileApp\lib\main.dart" >nul

echo [3/3] Building Flutter Release APK...
cd /d "%~dp0Mobile\MobileApp"
call flutter pub get
call flutter build apk --release
if %ERRORLEVEL% neq 0 (
  echo Flutter build failed.
  exit /b %ERRORLEVEL%
)

copy /Y "build\app\outputs\flutter-apk\app-release.apk" "%~dp0app-release.apk"
echo ===================================================
echo BUILD SUCCESSFUL!
echo APK: %~dp0app-release.apk
echo ===================================================
pause
