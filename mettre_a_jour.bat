@echo off
setlocal enabledelayedexpansion
title VerseFlow - Mise a jour
cd /d "%~dp0"

set "ZIPFILE=%~dp0VerseFlow-win.zip"
set "INSTALLDIR=%~dp0VerseFlow"

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
echo Mise a jour du fichier .zip de l'application...
set "BUILTZIP="
for %%f in ("dist-electron\VerseFlow-*-win.zip") do set "BUILTZIP=%%f"
if not defined BUILTZIP (
  echo [ERREUR] Aucun .zip trouve dans dist-electron apres la construction.
  echo.
  pause
  exit /b 1
)
copy /y "!BUILTZIP!" "%ZIPFILE%" >nul
if errorlevel 1 (
  echo [ERREUR] Impossible de copier le .zip vers %ZIPFILE%.
  echo.
  pause
  exit /b 1
)

echo Extraction complete du .zip dans %INSTALLDIR%...
if exist "%INSTALLDIR%" rmdir /s /q "%INSTALLDIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%ZIPFILE%' -DestinationPath '%INSTALLDIR%' -Force"
if errorlevel 1 (
  echo [ERREUR] L'extraction du .zip a echoue.
  echo.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   Mise a jour terminee !
echo ============================================
echo.
echo La nouvelle version est prete a l'emploi dans :
echo   %INSTALLDIR%\VerseFlow.exe
echo.
echo Le fichier .zip a jour se trouve egalement ici :
echo   %ZIPFILE%
echo.
echo Vos presentations, styles et polices importees sont stockes dans
echo l'application elle-meme (pas dans ce dossier) : ils ne sont jamais
echo affectes par cette mise a jour.
echo.
pause
