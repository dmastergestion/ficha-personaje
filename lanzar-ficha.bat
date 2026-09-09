@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

if exist "%ProgramFiles%\nodejs\npm.cmd" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
if exist "%LocalAppData%\Programs\nodejs\npm.cmd" set "PATH=%LocalAppData%\Programs\nodejs;%PATH%"

where npm >nul 2>&1
if errorlevel 1 (
  echo No se encuentra Node.js / npm.
  echo Instala Node 20 o superior: https://nodejs.org/
  pause
  exit /b 1
)

if not exist "package.json" (
  echo No encuentro package.json. Coloca este .bat en la carpeta ficha-personaje.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Primera vez: instalando dependencias...
  call npm install
  if errorlevel 1 (
    echo Fallo al instalar dependencias.
    pause
    exit /b 1
  )
)

echo.
echo Ficha de personaje — deja esta ventana abierta.
echo Ciérrala cuando termines de jugar.
echo.
call npm run dev -- --open

echo.
pause
