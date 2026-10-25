#!/bin/bash
# Met a jour Diffusion Ecran depuis GitHub (tshibanda/projection, dossier
# diffusion-ecran). Seul ce dossier est telecharge. Les reglages (ecran
# choisi, cadrage) sont stockes dans les donnees de l'application et ne
# sont jamais touches par cette mise a jour.

REPO_URL="https://github.com/tshibanda/projection.git"
BRANCH="main"
APP_DIR="diffusion-ecran"

cd "$(cd "$(dirname "$0")" && pwd)"

pause_and_exit() {
  echo
  read -p "Appuyez sur Entree pour fermer..."
  exit "$1"
}

# Lance depuis le dossier diffusion-ecran d'un depot deja installe :
# on se place a la racine du depot.
if [ "$(basename "$PWD")" = "$APP_DIR" ] && [ -d "../.git" ]; then
  cd ..
fi
ROOT="$PWD"

if ! command -v git >/dev/null 2>&1; then
  echo "[ERREUR] git est introuvable. Ouvrez un Terminal et lancez : xcode-select --install"
  pause_and_exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[ERREUR] Node.js est introuvable. Installez-le depuis https://nodejs.org/"
  pause_and_exit 1
fi

DEPTH=""
if [ ! -d ".git" ]; then
  echo "Premiere mise a jour : rattachement au depot GitHub..."
  git init
  git remote add origin "$REPO_URL"
  git config core.sparseCheckout true
  mkdir -p .git/info
  echo "/$APP_DIR/" > .git/info/sparse-checkout
  DEPTH="--depth 1"
else
  echo "Depot deja rattache."
fi
[ -f ".git/shallow" ] && DEPTH="--depth 1"

echo "Recuperation des dernieres modifications..."
if ! git fetch $DEPTH origin "$BRANCH"; then
  echo
  echo "[ERREUR] Impossible de contacter GitHub. Verifiez la connexion internet."
  pause_and_exit 1
fi

if ! git checkout -f -B "$BRANCH" "origin/$BRANCH"; then
  echo
  echo "[ERREUR] La mise a jour des fichiers a echoue."
  pause_and_exit 1
fi
git branch --set-upstream-to="origin/$BRANCH" "$BRANCH" >/dev/null 2>&1

if [ ! -f "$APP_DIR/package.json" ]; then
  echo
  echo "[ERREUR] Le dossier $APP_DIR est absent de la branche $BRANCH sur GitHub."
  pause_and_exit 1
fi

echo
echo "Installation des dependances (peut prendre quelques minutes la premiere fois)..."
cd "$ROOT/$APP_DIR"
if ! npm install; then
  echo
  echo "[ERREUR] npm install a echoue. Consultez le message ci-dessus."
  pause_and_exit 1
fi
chmod +x demarrer.command mettre_a_jour.command 2>/dev/null

echo
echo "Mise a jour terminee. Lancez $APP_DIR/demarrer.command."
pause_and_exit 0
