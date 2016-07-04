@echo OFF
rem set PATH=%~d0\cm\runtime\Perl
set PYTHONPATH=%PYTHONPATH%;%~d0\ltd\tools\booster\boosterSocket
set PATH=%~d0\cm\runtime\python27;%PATH%
rem %1: NewerTag %2: olderTag
python %~d0\ltd\tools\booster\klocwork\webcheck\klockwork_web_check.py -r %1 -l %2 -s New -m audit
::pause&exit
