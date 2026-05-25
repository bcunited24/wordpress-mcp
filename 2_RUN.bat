@echo off
echo ============================================
echo   RinkNet Parent Email Scraper
echo ============================================
echo.
echo A browser window is about to open.
echo Log into RinkNet, then come back to this
echo window and press ENTER.
echo.
python scrape_rinknet.py
echo.
if %errorlevel% neq 0 (
    echo Something went wrong. Take a screenshot and send it for help.
) else (
    echo Finished! Open parent_emails.csv to see your results.
)
pause
