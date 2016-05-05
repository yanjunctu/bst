@echo OFF
set PYTHONPATH=%PYTHONPATH%;%~d0\ltd\tools\booster\boosterSocket
set PATH=%~d0\cm\runtime\Perl;%~d0\cm\runtime\python27;%PATH%
set PERL=%~d0\cm\runtime\Perl\ratlperl.exe

rem %1:submitter name  %2: submitter email  %3: baseline %4: releaseTag

python %~d0\ltd\tools\booster\klocwork\kw_desktop_run.py -m CI -d %~d0 -n %1 -e %2 -b %3 -t %4

::pause&exit
