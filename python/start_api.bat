@echo off
cd /d "%~dp0"
echo ============================================
echo   AgencyFlow - API Detection de Toxicite
echo ============================================
echo.
if not exist "model\toxic_model.pkl" (
    echo [ENTRAINEMENT] Modele non trouve - entrainement en cours...
    C:\Python312\python.exe train_model.py
    echo.
)
echo [DEMARRAGE] Lancement du serveur sur http://127.0.0.1:5000
echo.
C:\Python312\python.exe toxic_api.py
pause
