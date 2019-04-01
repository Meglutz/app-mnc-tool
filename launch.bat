@echo off

REM echo Duplicating mnemonic...

REM set ROOT_FILE=%~dp0\mnemonic.mnc
REM set SOURCE_FILE=%ROOT_FILE%.M_TOOL
REM copy /y %ROOT_FILE% %SOURCE_FILE%
REM echo M_TOOL >> %SOURCE_FILE%

echo Launching Electron with the MNC.Tool application...

echo %~dp0\node_modules\electron\dist\electron.exe %~dp0
%~dp0\node_modules\electron\dist\electron.exe %~dp0

echo Exiting...
