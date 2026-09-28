@echo off
title New Baby Born - Web Server (port 5503)
cd /d "%~dp0"
echo ===================================================
echo  New Baby Born - prototype web
echo  URL: http://127.0.0.1:5503/Views/Mobile/login.html
echo  Login: br01 / demo
echo  Tutup jendela ini = server berhenti
echo ===================================================
echo.
start "" "http://127.0.0.1:5503/Views/Mobile/login.html"
node "%~dp0scripts\static-server.js" "%~dp0" 5503
pause
