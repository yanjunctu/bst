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
import StringIO
import ssl
import time
import math
from pymongo import MongoClient
from xml.dom import minidom
        

WelcomeWords = '''
#####################################################################################################################
#                                                                                                                   #
#                  Welcome to new warning self check tool                                                           #
# This tool is used before you submit CI to find new warnings introduced by your new changes. You 'd better reslove #
# these new warnings before CI, otherwise, CI system will note down.                                                #
#####################################################################################################################
'''

CIMailSubject = '[Notice!] Found new warnings from your submitted code'


CIMailHeader = '''
This mail is sent as CI detected new warnings be introduced from your submit code. 
Please click /checkWarning.bat to do self audit before you submit IR to make sure no new warnings there.

Below is the raw output from the warning check tool, pls refer to it:
#############################################
'''
        

ALL_NEW_WARNINGS= OrderedDict()

BAHAMADIR='\\bahama\\code'
CYPHERDIR='\\pcr_srp\\code'
LOG_DIR='\\temp_log\\'
ANNOFILE_DIR=['\\bahama\\code\\annofile\\','\\pcr_srp\\code\\annofile\\']

CLEAN_CMDS=[{'cmdDir':BAHAMADIR,'cmdType':'path.bat && make clean selfChecking=Y','annofile':''},
		    {'cmdDir':CYPHERDIR,'cmdType':'path.bat && make host_clean_32mb selfChecking=Y','annofile':''},
			{'cmdDir':CYPHERDIR,'cmdType':'path.bat && make dsp_clean_32mb selfChecking=Y','annofile':''},
		   	{'cmdDir':CYPHERDIR,'cmdType':'path.bat && make bandit_clean selfChecking=Y','annofile':''}]

MATRIX_CMDS=[{'cmdDir':BAHAMADIR,'cmdType':'path.bat && make matrix selfChecking=Y','annofile':['matrix.xml']},
			 {'cmdDir':CYPHERDIR,'cmdType':'path.bat && make matrix_32mb selfChecking=Y','annofile':['matrix_32mb_arm_legacy.xml','matrix_32mb_arm_nolegacy.xml','matrix_32mb_dsp.xml']}
			]

BUILD_CMDS=[{'cmdDir':BAHAMADIR,'cmdType':'path.bat && make dsp_all selfChecking=Y','annofile':['dsp.xml']},
		    {'cmdDir':BAHAMADIR,'cmdType':'path.bat && make arm_all selfChecking=Y','annofile':['arm.xml']},
			{'cmdDir':CYPHERDIR,'cmdType':'path.bat && make srp_32mb selfChecking=Y','annofile':['arm_32mb.xml']},
			{'cmdDir':CYPHERDIR,'cmdType':'path.bat && make dsp_32mb_nomatrix selfChecking=Y','annofile':['dsp_32mb.xml']},
		    {'cmdDir':CYPHERDIR,'cmdType':'path.bat && make bandit selfChecking=Y','annofile':['matrix_32mb_dsp.xml','dsp_bandit.xml']}]

BAHAMA_ARM_LOG=['arm.xml','srp.xml','arm_link.xml','arm.txt']

All_CMDS =[CLEAN_CMDS,MATRIX_CMDS,BUILD_CMDS]

JENKINS_BUILD_JOBS = [{'jobname':'PCR-REPT-Bahama_Matrix_ARM_Build','annofile':'arm.txt'},
                      {'jobname':'PCR-REPT-Bahama_DSP_Build','annofile':'dsp.txt'},
                      {'jobname':'PCR-REPT-Cypher_DSP32_Build','annofile':'dsp_32mb.txt'},
                      {'jobname':'PCR-REPT-Cypher_Matrix32_ARM32_Build','annofile':'arm_32mb.txt'}]
DEFAULTTIME = 7;
JENKINS_URL = 'https://cars.ap.mot-solutions.com:8080'
JENKINS_USERNAME = 'jhv384'
JENKINS_TOKEN = '4aff12c2c2c0fba8342186ef0fd9e60c'
JENKINS_TRIGGER_JOBS = 'PCR-REPT-0-MultiJob';
BOOSTER_DB_NAME = 'booster'
Release_COLL='CI-PCR-REPT-Git-Release'

#---------------------------------------------------------------------------------------------------------------
# define class BuildLogReader 
#----------------------------------------------------------------------------------------------------------------
class BuildLogReader(object):
    buildLog = ""

    def __init__(self, isBahamaArm):
        if not isBahamaArm :
            self.warning_pattern= r'''"(?P<file_name>[^"]+)", line (?P<line_num>\d+): warning #(?P<warning_ID>\d+)-.*\n(\s*[^^]+\n)*(\s*\^.*)*'''
        else:
            self.warning_pattern= r'(?P<file_name>[^"\n]+):(?P<line_num>\d+)(:[^"\n]+)*:(?P<row_num>\d+): warning:.+'

        self.warning_pattern = re.compile(self.warning_pattern, re.IGNORECASE|re.MULTILINE)

    def validate_logfile(self):
        if not os.path.isfile(self.buildLog):
            return False
        return True

    def get_warnings(self, buildLog=''):
        self.buildLog = buildLog

        warnings = {}
        
        if not self.validate_logfile():
            content = self.buildLog
        else:
            with open(self.buildLog, 'r') as f:
                content = f.read()
                f.close()
        
        
        matches = [m for m in self.warning_pattern.finditer(content)]
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
        match = re.search(r'''^diff --git a(.*)\nnew file mode 100644\n''', section)
        if match:
            changes['newfile'] = True
        else:
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
            diff_output = subprocess.check_output(diff_cmd, stderr=subprocess.STDOUT,shell=True)
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
    
    build_log_reader = BuildLogReader(isBahamaArm)
    warnings ={}
    filename = os.path.basename(buildLog) 
    fileType = filename.split('.', 1)[1] 
    if fileType == 'xml':
        try:
            tree = ET.parse(buildLog) 
            root = tree.getroot()
        except Exception, e:
            print "Error:cannot parse file:{}".format(buildLog)
            sys.exit(1) 
            
        for output_node in root.iter('output'):
            warning_temp = build_log_reader.get_warnings(output_node.text)
            warnings=dict(warnings, **warning_temp)
    else:
        f=open(buildLog)
        logs=f.read()
        f.close()
        warning_temp = build_log_reader.get_warnings(logs)
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
    parser.add_argument('-m',dest="mode",choices=['preCI', 'CI', 'desktop','period'],required = True)
    parser.add_argument('-d',dest="drive")
    parser.add_argument('-l',dest="build_logs", nargs='*')
    #older(base) branch
    parser.add_argument('-b',dest="ci_Branch")
    parser.add_argument('-n',dest="CIUserName")
    parser.add_argument('-e',dest="CIUserEmail")
    parser.add_argument('-t',dest="releaseTag")
    #the unit is day
    parser.add_argument('-D',dest="pdays",default = 7,type=int)
    #whether need git blame
    parser.add_argument('-a',dest="audit")
    
    args = parser.parse_args()
    #the drive is the dir for period mode
    if args.mode != 'period':
       try:
            args.drive = args.drive.strip().rstrip(':')[0] + ':'
       except:
            args.drive = os.getcwd()	
            args.drive = args.drive.strip().rstrip(':')[0] + ':'
    
		
    # Only desktop mode require user pass a log file, CI and preCI mode will parse the log a hardcode path
    if args.mode == 'desktop':
        if not args.build_logs:
            print 'Error: missing build logs'
            sys.exit()
        for log in args.build_logs:
            if not os.path.exists(log): 
                print 'Error: build_log %r not found'%log
                sys.exit()

    return args

def parseLatestCITag(mergedTags):

    tagString = 'REPT_I02.07' 
    storeLagest = 0;
    storeTag = '';
    for line in mergedTags.splitlines():
        line = line.strip()
        if line.startswith(tagString):
            # A typical tag name is 'REPT_Emerald_I02.07.01.90'
            # Below code is go to get the biggest one, it will extract the last two number 01 and 90 to compare
            splitArr = line.split('.')
            lastIndex = len(splitArr)-1;
            lastLastIndex = lastIndex-1;
            s1 = splitArr[lastLastIndex]+splitArr[lastIndex];
            n1 = int(s1)
            if n1>storeLagest:
                storeLagest = n1;
                storeTag = line;
        
        else:
            continue;
        
    return storeTag;

def git_version_check():
    #the version should newer than 2.7.0.
    baseVerNum1=2;
    baseVerNum2=7;
    baseVerNum3=0;
    try:
        versionInfo = subprocess.check_output('git --version', stderr=subprocess.STDOUT)
    except WindowsError:
        print "ERROR:The git path not add to the path of your Environment Variables "
        sys.exit()
    #versionInfo is kind like "git version 2.8.3.windows.1"
    version = re.search(r"(?P<verNum1>\d+)\.(?P<verNum2>\d+)\.(?P<verNum3>\d+)\.",versionInfo)
    isOldVersion = False
    if version:
        if int(version.group(1)) < baseVerNum1:
            isOldVersion = True
        elif int(version.group(1)) == baseVerNum1:
            if int(version.group(2)) < baseVerNum2:
                isOldVersion = True
            elif int(version.group(2)) == baseVerNum2:
                if int(version.group(3)) < baseVerNum3:
                    isOldVersion = True
    
    if isOldVersion:
        reminderString = 'Your git version is '+ version.group(0) + os.linesep+ \
        'which is too old, please use a newer one.the download link as below:'+os.linesep+ \
        'https://drive.google.com/open?id=0B9KowNOuazOdOUEyRGM3dmplYUU';     
        print reminderString
        sys.exit()
                   
def pre_check(args):
    if args.mode == 'period':
        try:
            os.system('rm -rf {}\\temp_log'.format(args.drive));
        except:
            print 'can not remove temp_log'
        os.chdir(args.drive)
        os.system('mkdir 777 {}\\temp_log'.format(args.drive));
        subprocess.call('git fetch --all',shell=True)
    else:
        try:
            os.system('rd /s /q {}\\temp_log'.format(args.drive));
            os.mkdir('{}\\temp_log'.format(args.drive))
        except:
            print 'can not remove temp_log' 

        git_version_check()
        
        # To get the latest Tag engineer's branch based on
        mergedTags = subprocess.check_output('git tag --merged', stderr=subprocess.STDOUT)
        baseOnTag = parseLatestCITag(mergedTags)
            
        if args.mode == 'preCI' and not args.ci_Branch:
            # Make sure Git repo have mount to a drive firstly
            # match root driver, like c:\ or d:\
            valid_current_path_pattern = r'^\w:\\$'; 
            # as this file is called in root, so os.getcwd directly return is drive
            current_path_drive = os.getcwd();
            if re.match(valid_current_path_pattern,current_path_drive) == None:
               print("pls mount git repo to a drive, then get back to run this script")
               sys.exit()
                
            f = open(os.devnull, 'w')
            subprocess.call('git fetch --all', stdout=f, stderr=f)
            f.close()
            try:
                remote_branches = subprocess.check_output('git branch -r --merged', stderr=subprocess.STDOUT)
            except:
                print('failed to get remote branches, make sure you are in the correct repo directory')
                sys.exit()
            pattern =  r' *(.*)/(REPT_2\.7_INT)\n';
            match = re.search(pattern, remote_branches) 
            if match:
                args.ci_Branch = match.group(0).strip()
            else:
                if baseOnTag:
                    reminderString = 'You are based on '+ baseOnTag + os.linesep+ \
                    'which is not latest release tag, recommand you back to catch up.'+os.linesep+ \
                    'Do you want to continue find warning based on '+baseOnTag+'? y/n';
              
                    print(reminderString);
                    exitOrNot = raw_input();
                    if exitOrNot == 'y' or exitOrNot == 'yes':
                        args.ci_Branch = baseOnTag;
                    else:
                        sys.exit()
                else:
                    sys.exit()
        elif args.mode == 'desktop':
            if not args.ci_Branch:
                if baseOnTag:
                    args.ci_Branch = baseOnTag;
                else:
                    args.ci_Branch = 'HEAD'
        else: 
            #including  CI mode and default others to compare with last HEAD
            if not args.ci_Branch:
                sys.exit()          

    return args

def run_cmd(drive,cmdQ):
    while True:  
        cmdDic=cmdQ.get() 
        cmdType='cd '+drive+cmdDic['cmdDir']+' && '+cmdDic['cmdType']
        annofiles = cmdDic['annofile'];

        f = open(os.devnull, 'w')
        ret=subprocess.call(cmdType,shell=True,stdout=f,stderr=subprocess.STDOUT) 
        f.close()
        if ret==0:  
            print '%s is done!' %cmdType   
        else:
            print 'ERROR:%s is fail!!!' %cmdType  
            summarize_log_file = drive+LOG_DIR+'summarize.log'
            fp=file(summarize_log_file,'a+')

            for annofile in annofiles:

                annofileDir = cmdDic['cmdDir']+'\\annofile\\'+annofile;
                if os.path.exists(annofileDir):
                    try:
                        tree = ET.parse(annofileDir) 
                        root = tree.getroot()
                        for output_node in root.iter('output'):
                            print>>fp, output_node.text
                    except Exception, e:
                        print "Error:cannot parse file:{}".format(annofileDir)
                        
            print 'more details pls refer to %s' %summarize_log_file
            fp.close()
            sys.exit(1)
        cmdQ.task_done() 
            
def buildLog_generate(drive):
    print("start to generate the build log,this will take about 5 minutes")
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

            
def actionOnNewWarning(tag,name,mail,file):
    wkresult=WarnKlocCheckResult(releaseTag=tag,engineerName=name,engineerMail=mail,buildWarningCnt=len(ALL_NEW_WARNINGS),klocworkCnt=0);
    interface = BoosterClient();
    ret = interface.send(wkresult);
    if ret:
        #print "[send from client]: "+json.dumps(wkresult.getSendMsg());
        #print "[recv from server]: "+interface.recv();
        sendEmail(name,mail,file.getvalue(),CIMailSubject); 
        
def blameOnNewWarning(args):
    cwd = os.getcwd()
    unResolveList= OrderedDict()
    for (file_name,line) in ALL_NEW_WARNINGS.keys():
        blame_cmd ='git blame -e -L {start},{end} {filename} '.format(start=line,end=line,filename=(args.drive+os.path.abspath(file_name)))
 
        try:
            blame_output = subprocess.check_output(blame_cmd, stderr=subprocess.STDOUT,shell=True)
        except subprocess.CalledProcessError as err:
            print err
            continue;
        #get email,blame_output kind like:df584209 (<rurong.huang@motorolasolutions.com> 2016-06-12 15:58:32 +0800 585)
        match = re.match(r'^\w{8}\s\(<(.+)>\s\d{4}-\d{2}-\d{2}\s.+\)', blame_output)
        if not match:
            continue
        emailAddr = match.group(1)
        if unResolveList.has_key(emailAddr):
            unResolveList[emailAddr]['number']=unResolveList[emailAddr]['number']+1;
            unResolveList[emailAddr]['warning'][file_name,line]=ALL_NEW_WARNINGS[file_name,line]
        else :
            blameInfo = OrderedDict()
            blameInfo['number']=1
            warningDict = OrderedDict() 
            warningDict[file_name,line]=ALL_NEW_WARNINGS[file_name,line]
            blameInfo['warning']=warningDict
            unResolveList[emailAddr]=blameInfo
            
        if args.CIUserEmail:
            from boosterSocket import sendEmail
            stdout = sys.stdout
            sys.stdout = stdOutfile = StringIO.StringIO()
            
        for userEmail in unResolveList.keys():
            name = userEmail.split('@')[0]
            warningCnt = unResolveList[userEmail]['number']
            unResolveWarning = unResolveList[userEmail]['warning']
            print '\n\n\n{} total {} build warning unresolved :'.format(name,warningCnt)
            for (file_name,line) in unResolveWarning.keys():
                 print unResolveWarning[file_name,line]
                    
    if args.CIUserEmail:           
        sys.stdout = stdout
        if args.releaseTag:
            mailSubject = '<!!!> The unresolved build warning between : {} and {}'.format(args.ci_Branch,args.releaseTag)
        else:
            mailSubject = '[Notice!] The unresolved build warning on : {}'.format(args.ci_Branch)
        name = args.CIUserEmail.split('@')[0]
        sendEmail(name,args.CIUserEmail,stdOutfile.getvalue(),mailSubject);
        
    os.chdir(cwd)
    #return unResolveList
def getBuildLogFromConOut(jenkins,db,tag,fdir):
    logfiles = []
    for job in JENKINS_BUILD_JOBS:
        #get build number from database
        jobname = job['jobname']
        coll = 'CI-'+jobname
        obj = {"name": "NEW_BASELINE", "value": tag};
        condition ={"actions.parameters": {'$in': [obj]}}
        sortType=('number',-1)
        docs = db.findInfo(coll,condition,sortType)
        #only use the latest one,bcz may build pass but not release
        buildLog = jenkins.getConsoleOutput(jobname, docs[0]['number'])
        #save the buildLog to file
        logfile = str(fdir)+'temp_log/'+job['annofile'];
        f = open(logfile,'w')
        f.write(buildLog)
        f.close()
        logfiles.append(logfile)
        
    return logfiles
      
if __name__ == "__main__":

    tStart = datetime.datetime.now()
    args = process_argument()
    args = pre_check(args)
    
    #1.get change file and change line number
    if args.mode == 'period': 
        os.chdir(args.drive)
        #period mode need get the boundary tag according to pdays
        sys.path.append('/opt/booster_project/script/boosterSocket/')
        sys.path.append('/opt/booster_project/script/jenkins/')
        sys.path.append('/opt/booster_project/script/klocwork/webcheck/')
        from boosterSocket import sendEmail
        from parseJenkinsBuildHistory import BoosterJenkins,BoosterDB
        from klockwork_web_check import findBoundaryTag,getParameterValue
        dbClient = MongoClient()
        db = BoosterDB(dbClient, BOOSTER_DB_NAME)
        args = findBoundaryTag(args,db,Release_COLL)
        #checkout to the latest tag,bcz git blame need it
        
        subprocess.check_output('git checkout {}'.format(args.releaseTag), stderr=subprocess.STDOUT,shell=True)


    diff_parser = DiffParser(args.drive)
    status,changes = diff_parser.get_changes(args.ci_Branch)
    
    if not status:
        print 'failed to get new warnings for branch: '+args.ci_Branch
        sys.exit()
        
    #2.get the build log       
    if args.mode == 'period':
    #get the build log from jenkins console output if mode is period
        jenkins = BoosterJenkins(JENKINS_URL, JENKINS_USERNAME, JENKINS_TOKEN)
        logfiles = getBuildLogFromConOut(jenkins,db,args.releaseTag,args.drive)
    
    elif (args.mode == 'preCI'):
    #generate the build log if mode is preCI   
        os.system("cls") # clear screen
        print WelcomeWords;
        
        buildLog_generate(args.drive)
        #find all the buildlog file
        logfiles =[]
        for annofileDir in ANNOFILE_DIR:
            logfiles =logfiles + glob.glob(args.drive+annofileDir+ '*.xml')
    
    elif args.mode == 'desktop':
    # buildlog is passed from makefile for desktop mode
        logfiles = args.build_logs
        print os.linesep;
    
    # buildlog is exists in output folder, the only difference with preCI mode is , we have not to trigger the whole build self
    # and the seconds difference is need exclude the default.xml which is no needed to analysis, but in CI env, there will be have
    # default.xml generated from win32 build
    elif args.mode == 'CI':
        from boosterSocket import WarnKlocCheckResult,BoosterClient,sendEmail
        logfiles =[]
        for annofileDir in ANNOFILE_DIR:
            logfiles =logfiles + [fn for fn in glob.glob(args.drive+annofileDir+ '*.xml') if 'default.xml' not in fn]
        stdout = sys.stdout
        sys.stdout = stdOutfile = StringIO.StringIO()
        print CIMailHeader

    
    #3.find out the new warnings          
    for logfile in logfiles:
        
        isBahamaArm =False
        basename = os.path.basename(logfile)
        if basename != 'default.xml':
            if basename in BAHAMA_ARM_LOG:
                isBahamaArm=True
            (warnings,new_warnings)=get_new_warnings(logfile,changes,isBahamaArm)
            print_log(changes,warnings,new_warnings,logfile,args.drive)

    tEnd = datetime.datetime.now()

    print '\nWarning check is done!'
    print '\nIntroduced {num} warnings in total'.format(num=len(ALL_NEW_WARNINGS))
    print '\nMore details please refer to {summarize_log_file}\n'.format(summarize_log_file=args.drive+LOG_DIR+'summarize.log')
    print 'Warning check totally use {minute} minutes {seconds} seconds\n'.format(minute = int((tEnd-tStart).total_seconds() / 60),seconds = int((tEnd-tStart).total_seconds() % 60))
    
    #4.other actions on new warnings
    if (args.audit == 'Y' or args.audit == 'y') and len(ALL_NEW_WARNINGS)>0:
        if args.mode == 'CI':
            sys.stdout = stdout #recover sys.stdout
        blameOnNewWarning(args)
    elif args.mode == 'CI' and len(ALL_NEW_WARNINGS)>0:
        sys.stdout = stdout #recover sys.stdout      
        actionOnNewWarning(args.releaseTag,args.CIUserName,args.CIUserEmail,stdOutfile)
        
