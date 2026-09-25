#!/bin/bash
set -e
cd "$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  VerseFlow - Mise a jour locale"
echo "============================================"
echo

if ! command -v git >/dev/null 2>&1; then
  echo "[ERREUR] Git n'est pas installe."
  echo "Ouvrez un Terminal et lancez : xcode-select --install"
  echo
  read -p "Appuyez sur Entree pour fermer..."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[ERREUR] Node.js n'est pas installe."
  echo "Telechargez-le depuis https://nodejs.org/"
  echo
  read -p "Appuyez sur Entree pour fermer..."
  exit 1
fi

if [ ! -d ".git" ]; then
  echo "Aucun depot git trouve dans ce dossier."
  echo "Clonage de VerseFlow depuis GitHub..."
  echo
  if ! git clone https://github.com/tshibanda/projection.git .; then
    echo "[ERREUR] Le clonage a echoue. Verifiez votre connexion internet."
    echo
    read -p "Appuyez sur Entree pour fermer..."
    exit 1
  fi
else
  echo "Recuperation des dernieres modifications..."
  if ! git fetch origin main; then
    echo "[ERREUR] Impossible de contacter GitHub. Verifiez votre connexion internet."
    echo
    read -p "Appuyez sur Entree pour fermer..."
    exit 1
  fi
  git checkout main
  git reset --hard origin/main
fi

echo
echo "Installation des dependances (peut prendre quelques minutes la premiere fois)..."
if ! npm install; then
  echo "[ERREUR] npm install a echoue. Consultez le message ci-dessus."
  echo
  read -p "Appuyez sur Entree pour fermer..."
  exit 1
fi

echo
echo "Construction de l'application macOS..."
if ! npm run dist:mac; then
  echo "[ERREUR] La construction a echoue. Consultez le message ci-dessus."
  echo
  read -p "Appuyez sur Entree pour fermer..."
  exit 1
fi

echo
echo "============================================"
echo "  Mise a jour terminee !"
echo "============================================"
echo
echo "La nouvelle version se trouve dans :"
echo "  $(pwd)/dist-electron/mac-arm64/VerseFlow.app"
echo
echo "Vos presentations, styles et polices importees sont stockes dans"
echo "l'application elle-meme (pas dans ce dossier) : ils ne sont jamais"
echo "affectes par cette mise a jour."
echo
read -p "Appuyez sur Entree pour fermer..."
