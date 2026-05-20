@echo off
echo ====================================================
echo    HOTEL RICARDO OUAGADOUGOU - Demarrage
echo ====================================================
echo.

cd /d "%~dp0backend"

REM Installer les dependances si besoin
if not exist "node_modules" (
    echo Installation des dependances Node.js...
    npm install
    echo.
)

REM Initialiser la base de donnees si besoin
if not exist "database\hotel_ricardo.db" (
    echo Initialisation de la base de donnees...
    node database/seed.js
    echo.
)

echo Demarrage du serveur backend sur http://localhost:3000
echo.
echo Ouvrez ensuite :
echo  - Site web    : frontend/index.html
echo  - Admin       : frontend/admin/login.html
echo    Email       : admin@hotelricardo.com
echo    Mot de passe: Ricardo@2024!
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.

start "" http://localhost:3000/api/health
node server.js
pause
