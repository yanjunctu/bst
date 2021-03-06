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
AUDIT_TIME = 30 #30 days
DailyWords = '''
\n############################
you should fix the build warning in time,otherwise CI system will tag it as audit finding. and the issue allowed exist time is {} days   
\n############################
'''.format(AUDIT_TIME)     

ALL_NEW_WARNINGS= OrderedDict()
unResolveList= OrderedDict()
SUBMODUL=['bahama_codeplug','bahama_platform','gcp_ssp','pcr_csa']

managerEmail=["anlon.lee@motorolasolutions.com","xiao-fan.zhang@motorolasolutions.com","mengge.duan@motorolasolutions.com"]
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
    def __init__(self, repo,getchangType=False,comAndCodeSet = set()):
        self.repo = repo
        self.GetchangType = getchangType
        self.commAndCodeSet = comAndCodeSet
        self.intersection = set()
        self.oldstr_pattern = re.compile(r'(?P<old_string>\[-[^-\]]*-\])')
        self.commChange = 0
        self.codeChange = 0
        self.sourceCount = 0
        
    def identifyChangeType(self,line):
        #eg:define [-ONE_DIVIDEDBY_TWENTY-]{+ONE_DIVIDEDBY_TWENTY_test+} CF(0.05) [-/*1/20*/-]{+/*1/20  test*/+}
        #[-.*-] is old string {+.*+} is new(change) string
        #remove the old string then get :define {+ONE_DIVIDEDBY_TWENTY_test+} {+/*1/20  test*/+}
        tempmatches = [m for m in self.oldstr_pattern.finditer(line)]
        for tempmatch in tempmatches:
            try:
                old_string = tempmatch.groupdict()['old_string']
                line = line.replace(old_string,'')
            except Exception, e:
                continue
        #the comment and code may have below arrangement modes
        # code /* comment */
        # code /* comment 
        # /* comment */ code
        #  comment */ code
        # code //comment
        self.intersection.discard(self.sourceCount)
        self.commAndCodeSet.discard(self.sourceCount)
        line = line.replace(' ','')
        #find the comment range
        commstart = line.find('//')
        if commstart == -1:
            commstart = line.find('/*')
            if commstart == -1:
                commstart =1
            commend = line.find('*/')
            if commend == -1:
                commend = len(line)
        else:
            commend = len(line)
        
        #allocate the change range and compare to comment range
        startstr='{+'
        endstr ='+}'
        chstart = line.find(startstr)
        chend = line.find(endstr,chstart)
        commChange =0
        codeChange =0
        while -1 != chstart:
            chstart = chstart+2
            chend = chend-2
            if commstart <= chstart and commend >= chend:
                commChange = 1
            elif commstart > chend or commend < chstart:
                codeChange =1
            else:
                commChange =1
                codeChange =1
                                
            chstart = line.find(startstr,chend+2)
            chend = line.find(endstr,chstart)
    
        self.commChange += commChange
        self.codeChange += codeChange
        
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
                    if self.GetchangType and self.intersection:
                        self.identifyChangeType(line)
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
                if self.GetchangType :
                    if not self.commAndCodeSet:
                        break
                    self.intersection = self.commAndCodeSet & set(range(start,start+last))
                    if self.intersection:
                        self.sourceCount = start
                    
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
            if self.GetchangType :
                if not self.commAndCodeSet:
                    break
            if file_changes:
                all_changes[file_changes[0]] = file_changes[1]

            start = next_start
            next_start = diff.find(substr, start+len(substr))

        return all_changes


    def get_changes(self, commit,specifiedFile=''):
        cwd = os.getcwd()
        
        diff_cmd ='git diff --word-diff --unified=0 '+commit + ' ' +specifiedFile
        
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
def get_all_warnings(buildLog,isBahamaArm):
    
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
        
    return warnings



def get_new_warnings(buildLog,changes,isBahamaArm):
    
    warnings = get_all_warnings(buildLog,isBahamaArm)

    new_warnings = OrderedDict()
    for file_name  in changes:
        for warning in warnings:
            w_file_name,w_line = warning
            warning_content = warnings[warning]
            if (file_name in w_file_name):
                if changes[file_name]['newfile'] == True :
                    new_warnings[(w_file_name, w_line)] = warning_content
                    ALL_NEW_WARNINGS[(w_file_name, w_line)] = warning_content
                else:
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
    parser.add_argument('-a',dest="audit",default = "N")
    parser.add_argument('-prj',dest="project",default = "REPT_MAIN")
    
    args = parser.parse_args()
    #the drive is the dir for period mode
    if args.mode != 'period':
       try:
            args.drive = args.drive.strip().rstrip('/')[0]
       except:
            args.drive = os.getcwd()	
            args.drive = args.drive.strip().rstrip('/')[0]
    
		
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

    tagString = 'REPT_I17'
    storeLagest = 0;
    storeTag = '';
    for line in mergedTags.splitlines():
        line = line.strip()
        if line.startswith(tagString):
            # A typical tag name is like 'REPT_I16.04.01.07'
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
            #pattern =  r' *(.*)/(REPT_2\.7_INT)\n';
            pattern =  r' *(.*)/(main)\n';
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

            
def actionOnNewWarning(prj,tag,name,mail,file):
    wkresult=WarnKlocCheckResult(project=prj,releaseTag=tag,engineerName=name,engineerMail=mail,buildWarningCnt=len(ALL_NEW_WARNINGS),klocworkCnt=0);
    interface = BoosterClient();
    ret = interface.send(wkresult);
    if ret:
        #print "[send from client]: "+json.dumps(wkresult.getSendMsg());
        #print "[recv from server]: "+interface.recv();
        sendEmail(name,mail,file.getvalue(),CIMailSubject); 
        
def blameOnWarnings(drive,warnings):

    for warning in warnings:
        w_file_name,w_line = warning
        sub = w_file_name.split('/')[1]
        if sub in SUBMODUL:
            continue;
        warning_content = warnings[warning]
        print w_file_name
        blame_cmd ='git blame -e -L {start},{end} {filename} '.format(start=w_line,end=w_line,filename=(drive+w_file_name))
        try:
            blame_output = subprocess.check_output(blame_cmd, stderr=subprocess.STDOUT,shell=True)
        except subprocess.CalledProcessError as err:
            print err
            continue;
        #get email,blame_output kind like:df584209 (<rurong.huang@motorolasolutions.com> 2016-06-12 15:58:32 +0800 585)
        print blame_output
        match =  re.search('\s\(<(.+)>\s(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}).+\)', blame_output)
        if not match:
            print "not match"
            continue
        emailAddr = match.group(1)
        introduceTime=datetime.datetime.strptime(match.group(2),'%Y-%m-%d %H:%M:%S')
        baseTime = datetime.datetime.strptime('2016-10-24 12:11:15','%Y-%m-%d %H:%M:%S')
        if (introduceTime-baseTime).days < 0:
            continue;
        
        if unResolveList.has_key(emailAddr):
            unResolveList[emailAddr]['number']=unResolveList[emailAddr]['number']+1;
            unResolveList[emailAddr]['warning'][w_file_name,w_line,introduceTime]=warning_content
        else :
            blameInfo = OrderedDict()
            blameInfo['number']=1
            warningDict = OrderedDict() 
            warningDict[w_file_name,w_line,introduceTime]=warning_content
            blameInfo['warning']=warningDict
            unResolveList[emailAddr]=blameInfo  

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
        logfile = str(fdir)+'/temp_log/'+job['annofile'];
        f = open(logfile,'w')
        f.write(buildLog)
        f.close()
        print logfile
        logfiles.append(logfile)
        
    return logfiles
def findNewestTag(args,db,collname):
    
    obj = {"name": "PROJECT_NAME", "value": "REPT_MAIN"};
    condition ={'result':'SUCCESS',"actions.parameters": {'$in': [obj]}}
    sortType=('number',-1)
    docs = db.findInfo(collname,condition,sortType)

    #newest Tag
    args.releaseTag = getParameterValue(docs[0],'NEW_BASELINE')
    print 'the newest tag is :{} '.format(args.releaseTag)

    return args

def actionOnDailyMode(args):
    #get all the build warning from cars build job console output
    #use get blame to get the warning introduce time
    #audit if the introduce time > 30 days  
    dbClient = MongoClient()
    db = BoosterDB(dbClient, BOOSTER_DB_NAME)
    args = findNewestTag(args,db,Release_COLL)
    #checkout to the latest tag,bcz git blame need it
    checkoutCmd = 'git checkout {}'.format(args.releaseTag)
    print checkoutCmd
    subprocess.check_output(checkoutCmd.split(), stderr=subprocess.STDOUT)
    jenkins = BoosterJenkins(JENKINS_URL, JENKINS_USERNAME, JENKINS_TOKEN)
    logfiles = getBuildLogFromConOut(jenkins,db,args.releaseTag,args.drive)
    for logfile in logfiles:
        isBahamaArm =False
        basename = os.path.basename(logfile)
        if basename in BAHAMA_ARM_LOG:
            isBahamaArm=True
        warnings=get_all_warnings(logfile,isBahamaArm)
        blameOnWarnings(args.drive,warnings)
    print 'send email' 
    send_email()
    

def send_email():
    
    nowTime= datetime.datetime.now() 
    for engineerEAdr in unResolveList.keys():
        print engineerEAdr
        stdout = sys.stdout
        sys.stdout = stdOutfile = StringIO.StringIO()
        audit = False
        emailAdr = []
            
        issueCnt = unResolveList[engineerEAdr]['number']
        mailSubject = "{} you have total {} build warning unfixed".format(engineerEAdr.split("@")[0],issueCnt)
        print DailyWords
        warnings =  unResolveList[engineerEAdr]['warning']                  
        for (file_name, line,intrTime) in warnings:
            existdays =  (nowTime-intrTime).days  
            if existdays > AUDIT_TIME:
                print "The warning exceed the time limit {}，and already be node down".format(AUDIT_TIME)
                audit = True
            #print "\n {},{} Exist : {}, days".format(file_name,line,existdays)
            print "\n Exist : {}, days".format(existdays)
            #print file_name, line
            print warnings[file_name, line,intrTime]

        if audit:
            for mail in managerEmail:
                emailAdr.append(mail)                  
        emailAdr.append(engineerEAdr)
        sendEmail(engineerEAdr,emailAdr,stdOutfile.getvalue(),mailSubject);
        sys.stdout = stdout
    
    
if __name__ == "__main__":

    tStart = datetime.datetime.now()
    args = process_argument()
    args = pre_check(args)
    changes = []

    
    if args.mode == 'period':
        print "daily check begin ..."
        os.chdir(args.drive)
        sys.path.append('/opt/booster_project/script/boosterSocket/')
        sys.path.append('/opt/booster_project/script/jenkins/')
        sys.path.append('/opt/booster_project/script/klocwork/webcheck/')
        from sendEmail import sendEmail
        from parseJenkinsBuildHistory import BoosterJenkins,BoosterDB
        from klockwork_web_check import getParameterValue
        actionOnDailyMode(args)
        print "daily check done!!"
    else:
        #1.get change file and change line number
        diff_parser = DiffParser(args.drive)
        status,changes = diff_parser.get_changes(args.ci_Branch)
    
        if not status:
            print 'failed to get new warnings for branch: '+args.ci_Branch
            sys.exit()
        
        #2.get the build log       
        if (args.mode == 'preCI'):
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
            from boosterSocket import WarnKlocCheckResult,BoosterClient
            from sendEmail import sendEmail
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
        if args.mode == 'CI' and len(ALL_NEW_WARNINGS)>0:
            sys.stdout = stdout #recover sys.stdout      
            actionOnNewWarning(args.project,args.releaseTag,args.CIUserName,args.CIUserEmail,stdOutfile)
        
