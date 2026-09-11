@echo off
REM ===========================================================
REM  One-time setup — double-click this file once.
REM  Installs the image tool the build needs. You only need
REM  this the first time, or if you move the project to a
REM  different computer.
REM ===========================================================

cd /d "%~dp0"

echo.
echo   Installing what the build needs...
echo   This takes a minute the first time.
echo.

call npm install

echo.
if errorlevel 1 (
  echo   Something went wrong above.
  echo   Check that Node is installed: open a terminal and run  node --version
) else (
  echo   Done. You can now use preview.bat and ship.bat.
)

echo.
echo   Press any key to close.
pause >nul
