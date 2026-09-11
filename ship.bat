@echo off
REM ===========================================================
REM  Publish the site — double-click this file.
REM  Builds, then commits and pushes. If the build finds a
REM  problem, nothing is pushed and the window tells you why.
REM ===========================================================

REM run from this file's own folder, wherever it was launched from
cd /d "%~dp0"

echo.
echo   Publishing khxngLX
echo   ------------------
echo.

set "MSG="
set /p "MSG=  What changed? (press Enter to skip): "
if not defined MSG set "MSG=Update site content"

echo.
call npm run ship -- "%MSG%"

echo.
echo   ------------------
echo   Press any key to close.
pause >nul
