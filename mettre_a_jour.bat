@echo off
setlocal enabledelayedexpansion
title VerseFlow - Mise a jour
cd /d "%~dp0"

echo ============================================
echo   VerseFlow - Mise a jour locale
echo ============================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Git n'est pas installe ou n'est pas dans le PATH.
  echo Installez-le depuis https://git-scm.com/download/win puis relancez ce fichier.
  echo.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js n'est pas installe ou n'est pas dans le PATH.
  echo Installez-le depuis https://nodejs.org/ puis relancez ce fichier.
  echo.
  pause
  exit /b 1
)

if not exist ".git" (
  echo Aucun depot git trouve dans ce dossier.
  echo Clonage de VerseFlow depuis GitHub...
  echo.
  git clone https://github.com/tshibanda/projection.git .
  if errorlevel 1 (
    echo [ERREUR] Le clonage a echoue. Verifiez votre connexion internet.
    echo.
    pause
    exit /b 1
  )
) else (
  echo Recuperation des dernieres modifications...
  git fetch origin main
  if errorlevel 1 (
    echo [ERREUR] Impossible de contacter GitHub. Verifiez votre connexion internet.
    echo.
    pause
    exit /b 1
  )
  git checkout main
  git reset --hard origin/main
)

echo.
echo Installation des dependances (peut prendre quelques minutes la premiere fois)...
call npm install
if errorlevel 1 (
  echo [ERREUR] npm install a echoue. Consultez le message ci-dessus.
  echo.
  pause
  exit /b 1
)

echo.
echo Construction de l'application Windows...
call npm run dist:win
if errorlevel 1 (
  echo [ERREUR] La construction a echoue. Consultez le message ci-dessus.
  echo.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   Mise a jour terminee !
echo ============================================
echo.
echo La nouvelle version se trouve dans :
echo   %cd%\dist-electron\win-unpacked\VerseFlow.exe
echo.
echo Vos presentations, styles et polices importees sont stockes dans
echo l'application elle-meme (pas dans ce dossier) : ils ne sont jamais
echo affectes par cette mise a jour.
echo.
pause
