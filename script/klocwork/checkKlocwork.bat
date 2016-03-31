@echo OFF
rem set PATH=%~d0\cm\runtime\Perl
set PERL=%~d0\cm\runtime\Perl\ratlperl.exe
%PERL% "%~d0\ltd\tools\booster\klocwork\kw_desktop_check.pl" %~d0 REPT2.6_CYPHER 
::pause&exit