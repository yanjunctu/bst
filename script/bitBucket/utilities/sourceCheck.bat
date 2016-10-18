rem @echo OFF

rem  %1 repo dir %2 fromCommit %3 toCommit %4 proj %5 PRId %6 repo
D:
cd %1
git fetch
git checkout %2
rem cd ltd/tools/booster/sourceCount/ 
python %1/ltd/tools/booster/sourceCount/sourceCounter.py -f %2 -t %3 -p %4 -id %5 -r %6 -pc true
::pause&exit
