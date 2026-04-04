@echo off
setlocal
cd /d "%~dp0"
TITLE SHOSA Backend (JSON API v4)
echo Starting SHOSA Backend (JSON API v4)...
echo.
node server.js
echo.
echo SHOSA backend stopped.
pause
