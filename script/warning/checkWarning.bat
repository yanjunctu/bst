@echo OFF
rem set PATH=%~d0\cm\runtime\Perl
set PATH=%~d0\cm\runtime\python27;%PATH%
cd /

python %~d0\ltd\tools\booster\warning\findNewWarnings.py -m preCI -d %~d0  
cd /
::pause&exit
