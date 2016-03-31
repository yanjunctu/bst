# -*- coding: utf-8 -*-
try:
    import xml.etree.cElementTree as ET  
except ImportError:
    import xml.etree.ElementTree as ET 

import argparse
import os,sys,re,threading;
import datetime
from collections import OrderedDict
import string
import subprocess
from Queue import Queue 
import glob

WelcomeWords = '''
#####################################################################################################################
#                                                                                                                   #
#                  Welcome to new warning self check tool                                                           #
# This tool is used before you submit CI to find new warnings introduced by your new changes. You 'd better reslove #
# these new warnings before CI, otherwise, CI system will note down.                                                #
#####################################################################################################################
'''

ALL_NEW_WARNINGS= OrderedDict()

BAHAMADIR='\\bahama\\code'
CYPHERDIR='\\pcr_srp\\code'
LOG_DIR='\\temp_log\\'
ANNOFILE_DIR=['\\bahama\\code\\annofile\\','\\pcr_srp\\code\\annofile\\']

CLEAN_CMDS=[{'cmdDir':BAHAMADIR,'cmdType':'path.bat && make clean selfChecking=Y'},
		    {'cmdDir':CYPHERDIR,'cmdType':'path.bat && make host_clean_32mb selfChecking=Y'},
			{'cmdDir':CYPHERDIR,'cmdType':'path.bat && make dsp_clean_32mb selfChecking=Y'},
			{'cmdDir':CYPHERDIR,'cmdType':'path.bat && make host_matrix_clean selfChecking=Y'},
		   	{'cmdDir':CYPHERDIR,'cmdType':'path.bat && make bandit_clean selfChecking=Y'}]

MATRIX_CMDS=[{'cmdDir':BAHAMADIR,'cmdType':'path.bat && make matrix selfChecking=Y'},
			 {'cmdDir':CYPHERDIR,'cmdType':'path.bat && make matrix_32mb selfChecking=Y'}
			]

BUILD_CMDS=[{'cmdDir':BAHAMADIR,'cmdType':'path.bat && make dsp_all selfChecking=Y'},
		    {'cmdDir':BAHAMADIR,'cmdType':'path.bat && make arm_all selfChecking=Y'},
			{'cmdDir':CYPHERDIR,'cmdType':'path.bat && make host_32mb selfChecking=Y'},
			{'cmdDir':CYPHERDIR,'cmdType':'path.bat && make dsp_32mb selfChecking=Y'},
		    {'cmdDir':CYPHERDIR,'cmdType':'path.bat && make bandit selfChecking=Y'}]

BAHAMA_ARM_LOG=['arm.xml','srp.xml','arm_link.xml']

All_CMDS =[CLEAN_CMDS,MATRIX_CMDS,BUILD_CMDS]

#---------------------------------------------------------------------------------------------------------------
# define class BuildLogReader 
#----------------------------------------------------------------------------------------------------------------
class BuildLogReader(object):
    def __init__(self, buildLog=''):
        self.buildLog = buildLog

    def validate_logfile(self):
        if not os.path.isfile(self.buildLog):
            return False
        return True

    def get_warnings(self,isBahamaArm):
  
        if not isBahamaArm :
            warning_pattern= r'''"(?P<file_name>[^"]+)", line (?P<line_num>\d+): warning #(?P<warning_ID>\d+)-.*\n(\s*[^^]+\n)+(\s*\^.*)+'''
        else:
            warning_pattern= r'(?P<file_name>[^"\n]+):(?P<line_num>\d+)(:[^"\n]+)*:(?P<row_num>\d+): warning:.+'
	
        warning_pattern = re.compile(warning_pattern, re.IGNORECASE|re.MULTILINE)

        warnings = {}
        
        if not self.validate_logfile():
            content = self.buildLog
        else:
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
        changes = {'newfile':False, 'modifysections':[]}
        for line in section.split('\n'):
            match = re.search(r'^@@ -(.*) \+(.*) @@', line)

            if not match:
                continue

            change_a = match.group(1).split(',')
            change_b = match.group(2).split(',')
            # No need to process removed file
            if change_b[0] == '0' and change_b[1] == '0':
                return ()
            start = int(change_b[0])
            if len(change_b) < 2:
                last = 1
            else:
                last = int(change_b[1])
            changes['modifysections'].append({'start':start, 'last':last})
            if change_a[0] == '0' and change_a[1] == '0':
                changes['newfile'] = True
                break

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

def get_new_warnings(buildLog,changes,isBahamaArm):
    
    try:
        tree = ET.parse(buildLog) 
        root = tree.getroot()
    except Exception, e:
        print "Error:cannot parse file:{}".format(buildLog)
        sys.exit(1) 
        
    warnings ={}
    for output_node in root.iter('output'):
        build_log_reader = BuildLogReader(output_node.text)
        warning_temp = build_log_reader.get_warnings(isBahamaArm)
        warnings=dict(warnings, **warning_temp)

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
                        ALL_NEW_WARNINGS[(w_file_name, w_line)] = warning_content
    return (warnings,new_warnings)

def process_argument():
    parser = argparse.ArgumentParser(description="description:gennerate new warnings", epilog=" %(prog)s description end")
    parser.add_argument('-m',dest="mode",choices=['preCI', 'CI', 'desktop'],required = True)
    parser.add_argument('-d',dest="drive")
    parser.add_argument('-l',dest="build_logs", nargs='*')
    parser.add_argument('-b',dest="ci_Branch")
    args = parser.parse_args()
    try:
        args.drive = args.drive.strip().rstrip(':')[0] + ':'
    except:
        args.drive = os.getcwd()	
        args.drive = args.drive.strip().rstrip(':')[0] + ':'
		
    if args.mode != 'preCI':
        if not args.build_logs:
            print 'Error: missing build logs'
            sys.exit()
        for log in args.build_logs:
            if not os.path.exists(log): 
                print 'Error: build_log %r not found'%log
                sys.exit()

    return args

def pre_check(args):
    try:
        os.system('rd /s /q {}\\temp_log'.format(args.drive));
        os.mkdir('{}\\temp_log'.format(args.drive))
    except:
        print 'can not remove temp_log' 


    if args.mode == 'preCI':
    # Make sure Git repo have mount to a drive firstly
        valid_current_path_pattern = r'^\w:\\$';  # match root driver, like c:\ or d:\
        current_path_drive = os.getcwd();# as this file is called in root, so os.getcwd directly return is drive
        if re.match(valid_current_path_pattern,current_path_drive) == None:
            print("pls mount git repo to a drive, then get back to run this script")
            sys.exit()
        while True:
        # Get User from which team
            choose_team = raw_input('''Tell me which team are you from, input 1 or 2: 
1: emerald  2: nonEmerald\n''');

            if choose_team in ['1','2']:
                if choose_team == '1':
                    pattern = r' *(.*)/(REPT_2\.7_Emerald_INT)\n';
                    break;
                else:
                    pattern = r' *(.*)/(REPT_2\.7_nonEmerald_INT)\n';
                    break;
            else:
                print("input wrong")
                sys.exit()
        try:
            remote_branches = subprocess.check_output('git branch -r', stderr=subprocess.STDOUT)
        except:
            print('failed to get remote branches, make sure you are in the correct repo directory')
            sys.exit()
        match = re.search(pattern, remote_branches) 
        if match:
            f = open(os.devnull, 'w')
            subprocess.call('git fetch {} {}'.format(match.group(1), match.group(2)), stdout=f, stderr=f)
            args.ci_Branch = match.group(0).strip()
        else:
            print('no such branch in remote repo, make sure your repo is correct')
            sys.exit()
    if args.mode == 'desktop':
        if not args.ci_Branch:
            args.ci_Branch = 'HEAD'

    return args

def run_cmd(drive,cmdQ):
    while True:  
        cmdDic=cmdQ.get() 
        cmdType='cd '+drive+cmdDic['cmdDir']+' && '+cmdDic['cmdType']
        #logfile=drive+cmdDic['logfile']
        #ret=subprocess.call(cmdType,shell=True,stdout=open(logfile,'w'),stderr=subprocess.STDOUT) 
        f = open(os.devnull, 'w')
        ret=subprocess.call(cmdType,shell=True,stdout=f,stderr=subprocess.STDOUT) 
        if ret==0:  
            print '%s is done!' %cmdType   
        else:
            print 'ERROR:%s is fail!!!' %cmdType
            os._exit(1)
        cmdQ.task_done() 
            
def buildLog_generate(drive):
    print("start to generate the build log,this will take about 10 minutes")
    for cmds in All_CMDS:
        cmdQ = Queue()
        for cmdType in cmds:
            cmdQ.put(cmdType) 
        for cmdType in cmds:
            p = threading.Thread(target=run_cmd,args=(drive,cmdQ))
            p.setDaemon(True)  
            p.start()  
        cmdQ.join()
    print 'build logs have been generated'  
	
def print_log(changes,warnings,new_warnings,logfile,drive):

    print os.linesep*2
    
    changed_files = set([file_name for (file_name) in changes])
    warning_files = set([file_name for (file_name, line_num) in warnings])
    summarize_log_file = drive+LOG_DIR+'summarize.log'
    fp=file(summarize_log_file,'a+')

    """
    print '\nChecked {w_cnt} warning(s), {f_cnt} file(s) ({l_cnt} lines) changed'.format(
                  w_cnt=len(warnings), f_cnt=len(changed_files), l_cnt=len(changes))
    print>>fp,'\nChecked {w_cnt} warning(s), {f_cnt} file(s) ({l_cnt} lines) changed'.format(
                  w_cnt=len(warnings), f_cnt=len(changed_files), l_cnt=len(changes))
    """
                  
    if (0 == len(new_warnings)):
        print '[PASS] no new warning for {build_log} .'.format(build_log=logfile)
        print>>fp, '[PASS] no new warning for {build_log}.'.format(build_log=logfile)
    else:
        print '[Found {cnt} New Warnings] Whole log can be found at {build_log}:'.format(build_log=logfile,cnt=len(new_warnings))
        print>>fp, '[Found {cnt} New Warnings] Whole log can be found at {build_log}:'.format(build_log=logfile,cnt=len(new_warnings))
        
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
        print 'failed to get new warnings for branch: '+args.ci_Branch
        print changes
        sys.exit()

    #generate the build log if mode is preCI
    if (args.mode == 'preCI'):
        
        os.system("cls") # clear screen
        print WelcomeWords;
        
        buildLog_generate(args.drive)
        #find all the buildlog file
        logfiles =[]
        for annofileDir in ANNOFILE_DIR:
            logfiles =logfiles + glob.glob(args.drive+annofileDir+ '*.xml')
        
    else:
        logfiles = args.build_logs
        print os.linesep;
        
    for logfile in logfiles:
        
        isBahamaArm =False
        basename = os.path.basename(logfile)
        if basename in BAHAMA_ARM_LOG:
            isBahamaArm=True

        (warnings,new_warnings)=get_new_warnings(logfile,changes,isBahamaArm)
        print_log(changes,warnings,new_warnings,logfile,args.drive)
    
    tEnd = datetime.datetime.now()

    print '\nWarning check is done!'
    print '\nIntroduced {num} warnings in total'.format(num=len(ALL_NEW_WARNINGS))
    print '\nMore details please refer to {summarize_log_file}\n'.format(summarize_log_file=args.drive+LOG_DIR+'summarize.log')
    print 'Warning check totally use {minute} minutes {seconds} seconds\n'.format(minute = int((tEnd-tStart).total_seconds() / 60),seconds = int((tEnd-tStart).total_seconds() % 60))
