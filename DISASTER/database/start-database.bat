@echo off
echo ==========================================
echo   SAFEGUARD - Starting Local MongoDB
echo   Data stored in: D:\DISASTER\database\data
echo ==========================================
echo.

:: Check if mongod is available
where mongod >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] MongoDB is not installed or not in PATH.
    echo.
    echo Please install MongoDB Community Server:
    echo https://www.mongodb.com/try/download/community
    echo.
    echo During install, make sure to add MongoDB to PATH.
    pause
    exit /b 1
)

echo [OK] MongoDB found. Starting on port 27017...
echo [OK] Data directory: D:\DISASTER\database\data
echo [OK] Log file: D:\DISASTER\database\mongodb.log
echo.
echo Press Ctrl+C to stop the database server.
echo ==========================================

mongod --dbpath "D:\DISASTER\database\data" --logpath "D:\DISASTER\database\mongodb.log" --port 27017
pause
