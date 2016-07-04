@echo OFF
rem set PATH=%~d0\cm\runtime\Perl
set PYTHONPATH=%PYTHONPATH%;%~d0\ltd\tools\booster\boosterSocket
set PATH=%~d0\cm\runtime\python27;%PATH%

rem %1:submitter name  %2: submitter email  %3: baseline %4: releaseTag %5: audit
rem python %~d0\ltd\tools\booster\warning\findNewWarnings.py -m CI -d %~d0 -n %1 -e %2 -b %3 -t %4 -a %5

rem %1:submitter name  %2: submitter email  %3: baseline %4: releaseTag
python %~d0\ltd\tools\booster\warning\findNewWarnings.py -m CI -d %~d0 -n %1 -e %2 -b %3 -t %4 -a N
::pause&exit
