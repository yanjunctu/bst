# -*- coding: utf-8 -*-
__author__ = 'phkc36, cpn873'


import argparse
import os,sys,re,threading;
import datetime
from collections import OrderedDict
import string
import subprocess
from Queue import Queue 
import glob
BAHAMADIR='/bahama/code'
CYPHERDIR='/pcr_srp/code'
TEMP_DIR='/temp_warning/'
LOG_DIR = '/temp_warning/buildlog/'
CLEAN_CMDS=[{'cmdDir':BAHAMADIR,'cmdType':'path.bat && make clean','logfile':'/temp_warning/clean.log'},
		    {'cmdDir':CYPHERDIR,'cmdType':'path.bat && emake --win32 host_clean_32mb','logfile':'/temp_warning/clean.log'},
			{'cmdDir':CYPHERDIR,'cmdType':'path.bat && emake --win32 dsp_clean_32mb','logfile':'/temp_warning/clean.log'},
			{'cmdDir':CYPHERDIR,'cmdType':'path.bat && emake --win32 host_matrix_clean','logfile':'/temp_warning/clean.log'}]

BUILD_CMDS=[{'cmdDir':BAHAMADIR,'cmdType':'path.bat && make dsp_all','logfile':LOG_DIR+'bahama_dsp.log'},
		    {'cmdDir':BAHAMADIR,'cmdType':'path.bat && make arm_all','logfile':LOG_DIR+'bahama_arm.log'},
			{'cmdDir':CYPHERDIR,'cmdType':'path.bat && emake --win32 matrix_32mb_host && emake --win32  host_32mb','logfile':LOG_DIR+'cypher_host_build.log'},
			{'cmdDir':CYPHERDIR,'cmdType':'path.bat && emake --win32 matrix_32mb_dsp && emake --win32  dsp_32mb','logfile':LOG_DIR+'cypher_dsp_build.log'},
		    {'cmdDir':CYPHERDIR,'cmdType':'path.bat && emake --win32 bandit','logfile':LOG_DIR+'bandit_build.log'}]
#---------------------------------------------------------------------------------------------------------------
# define class BuildLogReader 
#----------------------------------------------------------------------------------------------------------------
class BuildLogReader(object):
    def __init__(self, buildLog=''):
        self.buildLog = buildLog

    def validate_log(self):
        if not os.path.isfile(self.buildLog):
            return False
        return True

    def get_warnings(self):
        if not self.validate_log():
            return None

        #warning_pattern_str = '''(^\"(?P<file_name>[^\"]{1,})\",\sline\s(?P<line_num>\d{1,})\:\swarning\s\#(?P<warning_ID>\d{1,})\-.*\n(\s{1,}[^\^]{1,}\n){1,}(\s{1,}\^\s{0,}\^{0,}){1,})'''
        warning_pattern_str = r'''"(?P<file_name>[^"]+)", line (?P<line_num>\d+): warning #(?P<warning_ID>\d+)-.*\n(\s*[^^]+\n)+(\s*\^.*)+'''
		
			
        warning_pattern = re.compile(warning_pattern_str, re.IGNORECASE|re.MULTILINE)

        warnings = {}
        with open(self.buildLog, 'r') as f:
            content = f.read()

        matches = [m for m in warning_pattern.finditer(content)]
        for match in matches:
            try:
                file_name = match.groupdict()['file_name'].replace('\\', '/')
                line_num = int(match.groupdict()['line_num'])
                pos = (file_name, line_num)
                warnings[pos] = match.group(0).replace('\\', '/')
            except Exception, e:
                continue
        #print len(matches)

        return warnings

#---------------------------------------------------------------------------------------------------------------
# define class DiffParser 
#----------------------------------------------------------------------------------------------------------------
class DiffParser(object):
    def __init__(self, repo):
        self.repo = repo


    def parse_section(self, section):
        match = re.search(r'^diff --git a(.*) b/', section)

        if not match:
            return ()

        filename = match.group(1)
        changes = {'modifysections':[]}
        for line in section.split('\n'):
            match = re.search(r'^@@ -(.*) +(.*) @@', line)

            if not match:
                continue
            change = match.group(2).split(',')
            start = int(change[0])
            if len(change) < 2:
                last = 1
            else:
                last = int(change[1])
            changes['modifysections'].append({'start':start, 'last':last})

        return (filename, changes) 


    def parse_diff(self, diff):
        substr = 'diff --git'
        all_changes = {}

        if not diff:
            return all_changes
        
        start = diff.find(substr)
        next_start = diff.find(substr, start+len(substr))
        while -1 != start:
            file_changes = self.parse_section(diff[start:next_start])
            if file_changes:
                all_changes[file_changes[0]] = file_changes[1]

            start = next_start
            next_start = diff.find(substr, start+len(substr))

        return all_changes


    def get_changes(self, commit):
        cwd = os.getcwd()
        diff_cmd ='git diff --unified=0 '+commit

        os.chdir(self.repo)
        try:
            diff_output = subprocess.check_output(diff_cmd, stderr=subprocess.STDOUT)
            output = self.parse_diff(diff_output)
            ret = (True, output)
        except subprocess.CalledProcessError as err:
            ret = (False, err.output)

        os.chdir(cwd)
        return ret  
#---------------------------------------------------------------------------------------------------------------
# class DiffParser end
#----------------------------------------------------------------------------------------------------------------



def get_new_warnings(buildLog,changes,drive):
    
    
    build_log_reader = BuildLogReader(buildLog)
    warnings = build_log_reader.get_warnings()

    new_warnings = OrderedDict()
    for file_name  in changes:
        for warning in warnings:
            w_file_name,w_line = warning
            warning_content = warnings[warning]
            if (file_name in w_file_name):
                modifysections = changes[file_name]['modifysections']
                for i in range(len(modifysections)):
                    start = modifysections[i]['start']
                    end = start+modifysections[i]['last']
                    linetemp = range(start,end)
                    if w_line in range(start, end):
                        new_warnings[(w_file_name, w_line)] = warning_content
    return (warnings,new_warnings)

def process_argument():
    parser = argparse.ArgumentParser(description="description:gennerate new warnings", epilog=" %(prog)s description end")
    parser.add_argument('-m',dest="mode",choices=['preCI', 'CI', 'desktop'],required = True)
    parser.add_argument('-d',dest="drive")
    parser.add_argument('-l',dest="build_log")
    parser.add_argument('-b',dest="ci_Branch")
    args = parser.parse_args()
    try:
        args.drive = args.drive.strip().rstrip(':')[0] + ':'
    except:
        args.drive = os.getcwd()	
        args.drive = args.drive.strip().rstrip(':')[0] + ':'
		
    if args.mode != 'preCI':
        try:
            if not os.path.exists(args.build_log): 
                print 'Error: build_log %r not found'%args.build_log
                sys.exit()
        except:
            print 'Error: the build_log not define'
            sys.exit()
	

    return args

def pre_check(args):
    # Make sure Git repo have mount to a drive firstly
    valid_current_path_pattern = r'^\w:\\$';  # match root driver, like c:\ or d:\
    current_path_drive = os.getcwd();# as this file is called in root, so os.getcwd directly return is drive
    if re.match(valid_current_path_pattern,current_path_drive) == None:
        print("pls mount git repo to a drive, then get back to run this script")
        sys.exit()
  
    if args.mode == 'preCI':
        while True:
        # Get User from which team
            choose_team = raw_input('''Tell me you from which team, input 1 or 2: 
1: emerald  2: nonEmerald\n''');

            if choose_team in ['1','2']:
                if choose_team == '1':
                    pattern = r' *(.*/REPT_2\.7_Emerald_INT)\n';
                    break;
                else:
                    pattern = r' *(.*/REPT_2\.7_nonEmerald_INT)\n';
                    break;
            else:
                print("input wrong")
                sys.exit()
        try:
            remote_branches = subprocess.check_output('git branch -r')
        except:
            print('failed to get remote branches, make sure you are in the repo directory')
            sys.exit()
        match = re.search(pattern, remote_branches) 
        if match:
            args.ci_Branch = match.group(1)
        else:
            print('no such branch in remote repo, make sure your repo is correct')
            sys.exit()
    if args.mode == 'desktop':
        if not args.ci_Branch:
            args.ci_Branch = 'HEAD'
        else:
            try:
                output = subprocess.check_output('git show '+args.ci_Branch, stderr=subprocess.STDOUT)
            except subprocess.CalledProcessError as err:
                print('failed to get branch info: '+args.ci_Branch)
                sys.exit()

    return args

def run_cmd(drive,cmdQ):
    while True:  
        cmdDic=cmdQ.get() 
        cmdType='cd '+drive+cmdDic['cmdDir']+' && '+cmdDic['cmdType']
        logfile=drive+cmdDic['logfile']
        ret=subprocess.call(cmdType,shell=True,stdout=open(logfile,'w'),stderr=subprocess.STDOUT) 
        if ret==0:  
            print '%s is done!' %cmdType   
        else:
            print 'ERROR:%s is fail!!!' %cmdType
            os._exit(1)
        cmdQ.task_done() 
            
def buildLog_generate(drive):
    
    print "remove folder generated last time"
    os.system('rd /s /q temp_warning');
    
    os.mkdir('temp_warning')
    os.mkdir('temp_warning\\buildlog')
    
    #clean old build logs
    print("cleaning old build out...")
    cmdQ = Queue()
    for clean in CLEAN_CMDS:
        cmdQ.put(clean) 
    for clean in CLEAN_CMDS:
        p = threading.Thread(target=run_cmd,args=(drive,cmdQ))
        p.setDaemon(True)  
        p.start()  
    cmdQ.join()
    print 'clean is Done'  
	
    #clean old build logs
    print("generate build log,this will take about 20 Minutes...")
    cmdQ = Queue()
    for build in BUILD_CMDS:
        cmdQ.put(build) 
    for build in CLEAN_CMDS:
        p = threading.Thread(target=run_cmd,args=(drive,cmdQ))
        p.setDaemon(True)  
        p.start()  
    cmdQ.join()
    print 'build is Done' 
	
def print_log(changes,warnings,new_warnings,logfile,drive):

    changed_files = set([file_name for (file_name) in changes])
    warning_files = set([file_name for (file_name, line_num) in warnings])
    summarize_log_file = drive+TEMP_DIR+'summarize.log'
    fp=file(summarize_log_file,'a+')

    print '\nChecked {w_cnt} warning(s), {f_cnt} file(s) ({l_cnt} lines) changed'.format(
                  w_cnt=len(warnings), f_cnt=len(changed_files), l_cnt=len(changes))
    print>>fp,'\nChecked {w_cnt} warning(s), {f_cnt} file(s) ({l_cnt} lines) changed'.format(
                  w_cnt=len(warnings), f_cnt=len(changed_files), l_cnt=len(changes))
    if (0 == len(new_warnings)):
        print'{build_log} No new warning.'.format(build_log=logfile)
        print>>fp, '{build_log} No new warning.'.format(build_log=logfile)
    else:
        print '{build_log} Introduced {cnt} new warning(s):'.format(build_log=logfile,cnt=len(new_warnings))
        print>>fp, '{build_log} Introduced {cnt} new warning(s):'.format(build_log=logfile,cnt=len(new_warnings))
    for (file_name, line) in new_warnings:
        print file_name, line
        print>>fp, file_name, line
        print new_warnings[(file_name, line)]
        print>>fp, new_warnings[(file_name, line)]
if __name__ == "__main__":

    tStart = datetime.datetime.now()

    args = process_argument()

    args = pre_check(args)
    
    #get change file and change line number
    diff_parser = DiffParser(args.drive)
    status,changes = diff_parser.get_changes(args.ci_Branch)
    if not status:
        print 'failed to get new warnings'
        sys.exit()

    #generate the build log if mode is preCI
    if (args.mode == 'preCI'):
        buildLog_generate(args.drive)
        #find all the buildlog file
        logfiles = glob.glob(args.drive+LOG_DIR+ '*.log')
        for logfile in logfiles:
            (warnings,new_warnings)=get_new_warnings(logfile,changes,args.drive)
            print_log(changes,warnings,new_warnings,logfile,args.drive)
    else:
        (warnings,new_warnings)=get_new_warnings(args.build_log,changes,args.drive)
        print_log(changes,warnings,new_warnings,args.build_log,args.drive)
    tEnd = datetime.datetime.now()
    print 'warning check is done!'
    print '\nmore details please refer to {summarize_log_file}\n'.format(summarize_log_file=args.drive+TEMP_DIR+'summarize.log')
    print 'warning check takes {time}\n'.format(time=(tEnd-tStart))

    exit()