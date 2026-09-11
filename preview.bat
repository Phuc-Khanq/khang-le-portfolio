@echo off
REM ===========================================================
REM  Preview the site locally — double-click this file.
REM  Opens your browser and keeps rebuilding as you save
REM  content.json or drop photos into artwork/.
REM  Close this window when you're done.
REM ===========================================================

cd /d "%~dp0"

echo.
echo   Starting preview at http://localhost:5173
echo   Close this window to stop.
echo.

REM give the server a moment, then open the browser
start "" /b cmd /c "timeout /t 2 >nul && start http://localhost:5173"

call npm run dev

echo.
echo   Server stopped. Press any key to close.
pause >nul
