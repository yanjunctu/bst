@echo OFF
set PATH=%~d0\cm\runtime\Perl;%~d0\cm\runtime\python27;%PATH%
set PERL=%~d0\cm\runtime\Perl\ratlperl.exe

python %~d0\ltd\tools\booster\klocwork\kw_desktop_run.py -m preCI -d %~d0  
cd /
pause&exit