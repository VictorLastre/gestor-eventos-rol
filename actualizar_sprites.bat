@echo off
chcp 65001 > nul
echo ===================================================================
echo  ACTUALIZADOR DE SPRITES Y RETRATOS - ASOCIACION DE ROL LA PAMPA
echo ===================================================================
echo.
echo Procesando imagenes en carpeta Sprites/...
python "%~dp0scripts\procesar_sprites.py"
echo.
echo ===================================================================
echo  Proceso finalizado. Puedes cerrar esta ventana.
echo ===================================================================
pause
