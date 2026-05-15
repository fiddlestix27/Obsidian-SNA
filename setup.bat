@echo off
REM Obsidian SNA Plugin Setup Script for Windows

setlocal enabledelayedexpansion

echo.
echo Obsidian SNA Plugin Setup
echo ==================================
echo.

REM Check if Node.js and npm are installed
where /q node
if errorlevel 1 (
    echo Error: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

where /q npm
if errorlevel 1 (
    echo Error: npm is not installed
    pause
    exit /b 1
)

echo [OK] Node.js and npm found
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo      Node version: %NODE_VERSION%
echo      npm version: %NPM_VERSION%
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Build the plugin
echo Building plugin...
call npm run build
if errorlevel 1 (
    echo Error: Failed to build plugin
    pause
    exit /b 1
)
echo [OK] Plugin built successfully
echo.

REM Check if files were created
if not exist "dist\main.js" (
    echo Error: main.js not found
    pause
    exit /b 1
)
if not exist "dist\manifest.json" (
    echo Error: manifest.json not found
    pause
    exit /b 1
)
if not exist "dist\styles.css" (
    echo Error: styles.css not found
    pause
    exit /b 1
)
echo [OK] All build files created
echo.

REM Set plugin directory
set "PLUGIN_DIR=%APPDATA%\.obsidian\plugins\obsidian-sna"
echo Plugin will be installed to:
echo %PLUGIN_DIR%
echo.

REM Ask for confirmation
setlocal
:confirm
set /p continue="Continue? (y/n): "
if /i "%continue%"=="y" goto proceed
if /i "%continue%"=="n" (
    echo Installation cancelled
    endlocal
    exit /b 0
)
goto confirm

:proceed
endlocal

REM Create plugin directory if it doesn't exist
if not exist "%PLUGIN_DIR%" (
    echo Creating plugin directory...
    mkdir "%PLUGIN_DIR%"
    if errorlevel 1 (
        echo Error: Failed to create plugin directory
        pause
        exit /b 1
    )
    echo [OK] Plugin directory created
) else (
    echo Plugin directory already exists
)

echo.
echo Copying plugin files...
copy /Y dist\main.js "%PLUGIN_DIR%\" >nul
if errorlevel 1 (
    echo Error: Failed to copy main.js
    pause
    exit /b 1
)
echo [OK] Copied main.js

copy /Y dist\manifest.json "%PLUGIN_DIR%\" >nul
if errorlevel 1 (
    echo Error: Failed to copy manifest.json
    pause
    exit /b 1
)
echo [OK] Copied manifest.json

copy /Y dist\styles.css "%PLUGIN_DIR%\" >nul
if errorlevel 1 (
    echo Error: Failed to copy styles.css
    pause
    exit /b 1
)
echo [OK] Copied styles.css

echo.
echo ==================================
echo Setup Complete!
echo ==================================
echo.
echo Next steps:
echo 1. Restart Obsidian (if it's currently open^)
echo 2. Go to Settings ^> Community plugins
echo 3. Look for 'Social Network Analysis' and enable it
echo 4. Open the graph view and use the SNA panel
echo.
echo For development:
echo   npm run dev    - Start development build with watch mode
echo   npm run build  - Create production build
echo.
pause
