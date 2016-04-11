# -*- coding: utf-8 -*-
import os,sys,re,threading;
import string
import subprocess
import datetime
from sys import path

PATTERN_EMER = r' *(.*)/(REPT_2\.7_Emerald_INT)\n'
FCL_FILE = '\\temp_log\\temp_FCL.txt'
SCRIPT_DIR = '\\ltd\\tools\\booster\\warning'
REPORT_FILE = '\\temp_log\\\\kw_check.report'
KW_LOG = '\\temp_log\\kw_check.log'

drive= os.getcwd().strip().rstrip(':')[0] + ':'
script_from_dir = r'{}{}'.format(drive,SCRIPT_DIR)
path.append(script_from_dir)
from findNewWarnings import DiffParser
from findNewWarnings import process_argument
from findNewWarnings import pre_check  

WelcomeWords = '''
###############################################################################
#                                                                             #
#           Welcome to new klocwork issues self check tool                    #
#This tool is used before you submit CI to find new klocwork issues introduced#
#by your new changes. You 'd better reslove these new warnings before CI,     #
#otherwise, CI system will note down.                                         #
###############################################################################
'''


def local_kw_print(logfile):

    local_kw_pattern_str = r'''(^\d+ \(Local\)+(.+\n)+)'''

    local_kw_pattern = re.compile(local_kw_pattern_str, re.IGNORECASE|re.MULTILINE)

    with open(logfile, 'r') as f:
        content = f.read()

    matches = local_kw_pattern.finditer(content)

    if not matches:
        print "[PASS]:no new klovwork issue"
    else:
        length =0
        for match in matches:
            kwissue=match.group(0).replace('\\', '/')
            length =length+1
            print kwissue
        if length == 0:
            print "[PASS]:no new klovwork issue"
        else:
            print "[NOTICE!!!]:Found {number} new klovwork issue in total".format(number=length)

if __name__ == "__main__":
    
    tStart = datetime.datetime.now()
    
    args = process_argument()

    args = pre_check(args)
    
    os.system("cls") # clear screen
    print WelcomeWords;
    
    match = re.search(PATTERN_EMER, args.ci_Branch) 
    if match:
        kw_project = 'REPT2.7_nonEmerald';
    else:
        kw_project = 'REPT2.7_Emerald';
    
    #get change file
    print 'get the file change list...'
    diff_parser = DiffParser(args.drive)
    status,changes = diff_parser.get_changes(args.ci_Branch)
    if not status:
        print 'failed to get FCL'
        sys.exit()
        
    fcl_file=args.drive+FCL_FILE
    fp=open(fcl_file,'w')
    file_number =0
    
    for file_name  in changes:
       if changes[file_name]['newfile'] == False:
            match = re.search(r'((.*)\.c(pp)?$)',file_name,re.IGNORECASE)
            if not match:
                match = re.search(r'((.*)\.h$)',file_name,re.IGNORECASE)
                if not match:
                    continue
            
            check_file=args.drive+file_name
            check_file=check_file.replace('/','\\')
            fp.write(check_file + "\n")
            file_number = file_number+1;
    fp.close()
	
    if file_number == 0:
        print 'No .cpp/.c/.h file change,Klocwork issues self check END '
        sys.exit()
    else:
        print '{number} files change'.format(number = file_number)
    
    cmd_kw = 'ratlperl {}\\ltd\\tools\\booster\\klocwork\\kw_desktop_check.pl {} {} {}'.format(args.drive,args.drive,kw_project,fcl_file)
    print 'start to run klocwork,this will take some time,please wait...'
    
    kw_log =args.drive+KW_LOG
    f = open(kw_log, 'w')
    ret = subprocess.call(cmd_kw,shell=True,stdout=f,stderr=f)
    # stdout=f,
    if ret!=0:  
        print 'ERROR:klocwork is fail!!!'
        sys.exit(1)
    logfile = args.drive+REPORT_FILE
    local_kw_print(logfile)
    tEnd = datetime.datetime.now()
    """
    try:
        os.remove(fcl_file)
    except:
        print 'can not remove the file {}'.format(fcl_file)
    """

    print '\nKlocwork check is done!'
    print '\nMore information pls refer to {}'.format(logfile)
    print 'Totally use {minute} minutes {seconds} seconds\n'.format(minute = int((tEnd-tStart).total_seconds() / 60),seconds = int((tEnd-tStart).total_seconds() % 60))
    