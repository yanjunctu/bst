#-*- coding:utf-8 -*-
#@author qpcb36-rurong.huang
#analyze the source file (.c,.cpp,.h...), count the code lines,commnets lines,blank lines
import argparse
import os,sys,re,threading;
import subprocess
from sys import path
import StringIO
import httplib
from base64 import b64encode
import json



cwd = os.path.dirname(__file__)
SCRIPT_DIR='/../../../../cm/runtime/python27/Lib/site-packages'
repo_runtime_dir=os.path.abspath(cwd+SCRIPT_DIR)
path.insert(0, repo_runtime_dir) 


SCRIPT_DIR = '/../warning'
script_from_dir = os.path.abspath(cwd+SCRIPT_DIR)
path.append(script_from_dir)
from findNewWarnings import DiffParser


SOCKET_DIR = '/../boosterSocket'
script_from_dir = os.path.abspath(cwd+SOCKET_DIR)
path.append(script_from_dir)
from boosterSocket import sendEmail

THRESHOLD = 30

EXCLUDE_FILE = ["\\win32_stubs\\","\\win32_common_includes\\","\\Unit_Tests\\","\\Win32Runner\\","\\CypherVersionNumDefine.h","\\unit_test\\"]

#-----------bitbucket--------

BITBUCKET_PW="configQ2@"
BITBUCKET_UN = "amb4116"
BITBUCKET_URL = "bitbucket.mot-solutions.com";

#---------------------------------------------------------------------------------------------------------------
# define class Bitbucket rest api 
#----------------------------------------------------------------------------------------------------------------
class BitbucketREST(object):
    def __init__(self, url, username=None, password=None):
        self.url = url
        self.user = username
        self.password = password

    def postComment(self,proj,repo,PRId,text):

        path = '/rest/api/1.0/projects/{}/repos/{}/pull-requests/{}/comments'.format(proj,repo,PRId);
        userAndPass = "%s:%s" % (self.user,self.password)
        userAndPass = b64encode(userAndPass).decode("ascii")
      
        payload = json.dumps({'text': text})
        headers = { 'Authorization' : 'Basic %s' %  userAndPass,'Content-type': 'application/json'}


        conn = httplib.HTTPConnection(self.url)
        conn.request("POST", path, payload, headers)
        response = conn.getresponse()
        conn.close() 
        #print response.status, response.reason


#---------------------------------------------------------------------------------------------------------------
# define class sourceCounter 
#----------------------------------------------------------------------------------------------------------------
class sourceCounter(object):
    def __init__(self):
        self.isBlockComment = False 
        self.filesInfo={}
        
    def identifyOneline(self,line):
        
        line=line.strip()
        lineType,lineLen =0,len(line)
        iChar, isLineComment = 0, False
        line = line + '\n'
        while iChar < lineLen:
            if line[iChar] == ' ' or line[iChar] == '\t' or line[iChar] == '{' or line[iChar] == '}':   #blank
                iChar += 1; continue
            elif line[iChar] == '/' and line[iChar+1] == '/': #line comment
                isLineComment = True
                lineType |= 2; iChar += 1 
            elif line[iChar] == '/' and line[iChar+1] == '*': #block comment began
                self.isBlockComment = True
                lineType |= 2; iChar += 1
            elif line[iChar] == '*' and line[iChar+1] == '/': #the end of block comment
                self.isBlockComment = False
                lineType |= 2; iChar += 1
            else:
                if isLineComment or self.isBlockComment:
                    lineType |= 2
                else:
                    lineType |= 1
            iChar += 1
        # 0:blank，1:code，2:comment，3:code ande comment
        return lineType
    
    #calc the code,comments,blank info in .c,.cpp,.h files
    def countFileLines(self,filePath):
        blankdic = {'total':0,'detail':[]}
        codedic = {'total':0,'detail':[]}
        commentdic = {'total':0,'detail':[]}
        comAndCodedic = {'total':0,'detail':[]}
        fp = open(filePath)
        lineNum ,self.isBlockComment= 1,False

        while True:
            line = fp.readline()  
      
            if len(line) == 0: 
                #end of a file
                break   
            lineType = self.identifyOneline(line)
            
            #0:blank，1:code，2:comment，3:code ande comment
          
            if lineType == 0 :
                blankdic['total'] +=1
                blankdic['detail'].append(lineNum)
            elif lineType == 1:
                codedic['total'] +=1
            elif lineType == 2:
                commentdic['total'] +=1
                commentdic['detail'].append(lineNum)
            elif lineType == 3:
                comAndCodedic['total'] +=1
                comAndCodedic['detail'].append(lineNum)
            else:
                print 'Unexpected lineType: %d(0~3)!' %lineType
            lineNum +=1
                
        dic = {'blank':blankdic,'comment':commentdic,'comAndCode':comAndCodedic,'code':codedic}
        self.filesInfo[filePath] = dic
            
    def count(self,filePath):
        
        if os.path.isfile(filePath):
            fileExt = os.path.splitext(filePath)

            if fileExt[1] == '.c' or fileExt[1] == '.h' or fileExt[1] == '.cpp' :
                self.countFileLines(filePath)
        else:
            files = os.listdir(filePath)
            for f in files:
                fPath = os.path.join(filePath,f)
                if os.path.isfile(fPath):
                    fileExt = os.path.splitext(fPath)
                    if fileExt[1] == '.c' or fileExt[1] == '.h' or fileExt[1] == '.cpp' :
                        self.countFileLines(fPath)
                else:
                    self.count(fPath)
                    
def isExcludefile(file_name):
    #win32 test related file no need to check comments
    for excludeStr in EXCLUDE_FILE:
        if excludeStr in file_name:
            return True
    return False
    

def count_change_lines(changes,baseOnTag):
  
    sumCountDict={'code_total':0,'comments_total':0,'detail':{}}
    cwd = os.path.dirname(__file__)
    repoDir=os.path.abspath(cwd+'/../../../..')
    #root = os.getcwd().strip().rstrip(':')[0] + ':'
    for file_name  in changes:
        filepath = os.path.abspath(repoDir+file_name)
    
        if os.path.isfile(filepath) and not isExcludefile(filepath):
            countorObj = sourceCounter()
            countorObj.count(filepath)
            if countorObj.filesInfo:
                lineDict = {'code':0,'comments':0}
                comment = countorObj.filesInfo[filepath]['comment']
                comAndCode = countorObj.filesInfo[filepath]['comAndCode']
                code = countorObj.filesInfo[filepath]['code']
                blank = countorObj.filesInfo[filepath]['blank']
                #new file
                if changes[file_name]['newfile']:

                    lineDict['code'] =code['total'] + comAndCode['total']
                    lineDict['comments'] = comment['total'] + comAndCode['total']
                else:
                    #get all the change lines of file_name
                    lineSet =set()
                    modifysections = changes[file_name]['modifysections']
                    for i in range(len(modifysections)):
                        start = modifysections[i]['start']
                        end = start+modifysections[i]['last']
                        lineSet.update(range(start,end))
                        
                    #classfy the changes to code or comment
                    commentSet = lineSet & set(comment['detail'])
                    comAndCodeSet = lineSet & set(comAndCode['detail'])
                    blankSet = lineSet & set(blank['detail'])
                    lineDict['comments']= len(commentSet)
                    lineDict['code']=len(lineSet) - len(blankSet)-len(comAndCodeSet)-len(commentSet)
                    
                    if comAndCodeSet:
                  
                        identify_parser = DiffParser(repoDir,True,comAndCodeSet)
                        identify_parser.get_changes(baseOnTag+' '+ filepath)
                        lineDict['comments'] +=identify_parser.commChange
                        lineDict['code'] += identify_parser.codeChange
                    
                
                        
                sumCountDict['detail'][filepath]=lineDict
                sumCountDict['code_total'] += lineDict['code']
                sumCountDict['comments_total'] += lineDict['comments']
                        
    return sumCountDict

def process_argument():
    parser = argparse.ArgumentParser(description="description:comment ratio calc", epilog=" %(prog)s description end")
    parser.add_argument('-t',dest="toCommit",default = "main")
    parser.add_argument('-f',dest="fromCommit")
    parser.add_argument('-p',dest="proj")
    parser.add_argument('-id',dest="prID")
    parser.add_argument('-r',dest="repo")
    parser.add_argument('-pc',dest="postComment",default = "false")
    parser.add_argument('-s',dest="submitter",default = "boosterAngelTeam")

    args = parser.parse_args()
    return args

if __name__ =='__main__':
    
    args = process_argument()
    
    #get the base Tag
  
    getCmd = 'git merge-base {} {}'.format(args.fromCommit,args.toCommit)
    baseOnTag = subprocess.check_output(getCmd.split(), stderr=subprocess.STDOUT)
    
    #get the changes info
    cwd = os.path.dirname(__file__)
    repoDir=os.path.abspath(cwd+'/../../../..')
    diff_parser = DiffParser(repoDir)
    status,changes = diff_parser.get_changes(baseOnTag)
    
    #go through the changed files to get the changed code lines and changed comments lines
    sumCountDict=count_change_lines(changes,baseOnTag)
    
    if args.submitter or args.postComment:
        stdout = sys.stdout
        sys.stdout = stdOutfile = StringIO.StringIO()
        UserEmail = args.submitter +"@motorolasolutions.com"
        
    if sumCountDict['code_total'] ==0 and sumCountDict['comments_total']==0:
        comment_rate ="infinity,no code line changed"
    else:
        comment_rate = sumCountDict['comments_total']*100/sumCountDict['code_total']
        
    #if comment_rate >= THRESHOLD or sumCountDict['code_total'] < 3:
        #mailSubject = '[congratulation!] the comments rate from your submitted code is {}% ,code changed lines :{}'.format(comment_rate,sumCountDict['code_total']) 
    if comment_rate < THRESHOLD and sumCountDict['code_total'] > 3:
        stdout = sys.stdout
        sys.stdout = stdOutfile = StringIO.StringIO()
        if args.postComment != "false":
            print '''
## the comments rate(comments/code) of your PR as below:
|             | rate    |
| ------------|---------|
| YOUR   PR   | {}%     |
| expectation | {}%     |
            '''.format(comment_rate,THRESHOLD)
            sys.stdout = stdout
            bitBucketApi = BitbucketREST(BITBUCKET_URL,BITBUCKET_UN,BITBUCKET_PW)
            bitBucketApi.postComment(args.proj,args.repo,args.prID,stdOutfile.getvalue())
        elif atgs.submitter:
            UserEmail = args.submitter +"@motorolasolutions.com"
            mailSubject = '[Notice!] the comments rate from your submitted code is {}% which is below the threshold {}%'.format(comment_rate,THRESHOLD) 
           
            print '''
***************************************************
code               changed lines: {}
comments       changed lines: {}
comments rate(comments/code): {}% (threshhold:{}%)
******************************************************
    '''.format(sumCountDict['code_total'],sumCountDict['comments_total'],comment_rate,THRESHOLD)
            for key in sumCountDict['detail']:
                record = sumCountDict['detail'][key]
                print '''
{} : code changed lines: {} comments changed lines: {}
----------------------------------------------------------------------------------------------------
        '''.format(key,record['code'],record['comments']) 
            sys.stdout = stdout
            sendEmail(args.submitter,UserEmail,stdOutfile.getvalue(),mailSubject);
    #print sumCountDict
                            

            

            
            
            
            
            