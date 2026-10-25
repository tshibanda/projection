@echo off
REM Met a jour Diffusion Ecran depuis GitHub (tshibanda/projection, dossier
REM diffusion-ecran). Seul ce dossier est telecharge. Les reglages (ecran
REM choisi, cadrage) sont stockes dans les donnees de l'application et ne
REM sont jamais touches par cette mise a jour.
setlocal
title Diffusion Ecran - Mise a jour
cd /d "%~dp0"

set "REPO_URL=https://github.com/tshibanda/projection.git"
set "BRANCH=main"
set "APP_DIR=diffusion-ecran"

REM Lance depuis le dossier diffusion-ecran d'un depot deja installe :
REM on se place a la racine du depot.
for %%I in ("%~dp0.") do set "HERE=%%~nxI"
if /i "%HERE%"=="%APP_DIR%" if exist "..\.git" cd ..
set "ROOT=%CD%"

git --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] git est introuvable. Installez-le depuis git-scm.com
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js est introuvable. Installez-le depuis nodejs.org
    pause
    exit /b 1
)

set "DEPTH="
if not exist ".git" (
    echo Premiere mise a jour : rattachement au depot GitHub...
    git init
    git remote add origin %REPO_URL%
    git config core.sparseCheckout true
    if not exist ".git\info" mkdir ".git\info"
    (echo /%APP_DIR%/)> ".git\info\sparse-checkout"
    set "DEPTH=--depth 1"
) else (
    echo Depot deja rattache.
)
if exist ".git\shallow" set "DEPTH=--depth 1"

echo Recuperation des dernieres modifications...
git fetch %DEPTH% origin %BRANCH%
if errorlevel 1 (
    echo.
    echo [ERREUR] Impossible de contacter GitHub. Verifiez la connexion internet.
    goto :fin
)

git checkout -f -B %BRANCH% origin/%BRANCH%
if errorlevel 1 (
    echo.
    echo [ERREUR] La mise a jour des fichiers a echoue.
    goto :fin
)
git branch --set-upstream-to=origin/%BRANCH% %BRANCH% >nul 2>&1

if not exist "%APP_DIR%\package.json" (
    echo.
    echo [ERREUR] Le dossier %APP_DIR% est absent de la branche %BRANCH% sur GitHub.
    goto :fin
)

echo.
echo Installation des dependances (peut prendre quelques minutes la premiere fois)...
cd /d "%ROOT%\%APP_DIR%"
call npm install
if errorlevel 1 (
    echo.
    echo [ERREUR] npm install a echoue. Consultez le message ci-dessus.
    goto :fin
)

echo.
echo Mise a jour terminee. Lancez %APP_DIR%\demarrer.bat.

:fin
echo.
pause
endlocal
