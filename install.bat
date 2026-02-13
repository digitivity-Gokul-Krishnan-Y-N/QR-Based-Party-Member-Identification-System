@echo off
echo ================================================
echo QR Party Member Identification System
echo Installation Script for Windows
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python is not installed!
    echo Please install Python from https://python.org/
    echo.
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

echo Python version:
python --version
echo.

echo ================================================
echo Step 1: Installing root dependencies...
echo ================================================
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)
echo Root dependencies installed successfully!
echo.

echo ================================================
echo Step 2: Installing backend dependencies...
echo ================================================
cd backend
call pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo Backend dependencies installed successfully!
echo.

echo ================================================
echo Step 3: Installing frontend dependencies...
echo ================================================
cd client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo Frontend dependencies installed successfully!
echo.

echo ================================================
echo Installation Complete!
echo ================================================
echo.
echo To start the system, run:
echo     npm start
echo.
echo The system will be available at:
echo     Frontend: http://localhost:5173
echo     Backend:  http://localhost:8000
echo.
echo For more information, see README.md
echo.
pause
