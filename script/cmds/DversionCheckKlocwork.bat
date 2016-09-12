@echo OFF
set PYTHONPATH=%PYTHONPATH%;%~d0\ltd\tools\booster\boosterSocket
set PATH=%~d0\cm\runtime\Perl;%~d0\cm\runtime\python27;%PATH%
set PERL=%~d0\cm\runtime\Perl\ratlperl.exe

rem %1:email %2 olderTag %3: NewerTag %4:project

python %~d0\ltd\tools\booster\klocwork\webcheck\klockwork_web_check.py -e %1 -l %2 -r %3 -s New -m audit -prj %project


::pause&exit
