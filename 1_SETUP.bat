@echo off
echo ============================================
echo   RinkNet Scraper - First-Time Setup
echo ============================================
echo.
echo Installing required tools... this may take a minute or two.
echo.

pip install playwright
if %errorlevel% neq 0 (
    echo.
    echo ERROR: pip command failed.
    echo Make sure you installed Python and checked "Add Python to PATH"
    echo during installation. See the README instructions.
    pause
    exit /b 1
)

playwright install chromium
if %errorlevel% neq 0 (
    echo.
    echo ERROR: playwright install failed.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Setup complete!
echo   Now double-click  2_RUN.bat  to start.
echo ============================================
pause
