# -*- coding: utf-8 -*-

import urllib, urllib2, json, sys, os.path, getpass, time
import re
import argparse
from urllib2 import HTTPError
from collections import OrderedDict
import StringIO
from pymongo import MongoClient

#klocwork
HOST = '10.193.226.186'
PORT = 8080
USER = 'huang rurong-QPCB36'
TOKEN = '3ce1d76aae49dc433da70c546f634b25f8734d9a59490831c41f8b261fe0e57e'
PROJECT = 'REPT2.7'
#jenkins
JENKINS_URL = 'https://cars.ap.mot-solutions.com:8080'
JENKINS_USERNAME = 'jhv384'
JENKINS_TOKEN = '4aff12c2c2c0fba8342186ef0fd9e60c'
KW_JOB = "PCR-REPT-Git-KW"
#data base
CI_KW_COLL_NAME = "klocwork";
BOOSTER_DB_NAME = 'booster'

class klocworkapi(object):
    def __init__(self, host,port,user,token):
        self.url = 'http://%s:%d/review/api' % (host, port)
        self.values = {"user": user,"ltoken":token}
        
    def setParameter(self,key,value):       
        self.values[key] = value
        
    def urlRequest(self): 

        data = urllib.urlencode(self.values)
        req = urllib2.Request(self.url, data)
        try:
            response = urllib2.urlopen(req)
        except HTTPError as e:
            print "HTTPError:"+e.read()
        return response
        
class Issue(object) :
    def __init__(self, attrs) :
        self.id = attrs["id"]
        self.message = attrs["message"]
        self.file = attrs["file"]
        self.method = attrs["method"]
        self.code = attrs["code"]
        self.severity = attrs["severity"]
        self.severityCode = attrs["severityCode"]
        self.title = attrs["title"]
        self.state = attrs["state"]
        self.status = attrs["status"]
        self.taxonomyName = attrs["taxonomyName"]
        self.url = attrs["url"]
        self.created=time.ctime(attrs["dateOriginated"]/1000)
        self.owner = attrs["owner"]
        
    def __str__(self) :
        return "[%d] %s\n\t%s | %s\n\tCode %s | Severity: %s(%d) | State: %s | Status: %s | Owner: %s | Created: %s\n\t%s" % (
        self.id, self.message, self.file, self.method, self.code, self.severity, self.severityCode, self.state,
        self.status, self.owner, self.created, self.url
        )
    
    
def from_json(json_object) :
   if 'id' in json_object :
      return Issue(json_object)
   return json_object

def convert_to_dicts(objs):
    obj_arr = []
    for o in objs:
        dict = {}
        dict.update(o.__dict__)
        obj_arr.append(dict)
    return obj_arr

def findInServerDB(qury):
    findresult = WarnKlocFindResult(qury)
    interface = BoosterClient();
    ret = interface.send(findresult);
    if ret:
        receive =interface.recv();
        receive = json.loads(receive)
        result = receive["result"]
        return result;
    return;

def recursiveFind(start,end):
    qury = {"buildNumber":{"$gte":start, "$lte":end}}
    record = findInServerDB(qury);
    #result = record["result"]
    if record == "FAIL":
        middle =start + ((end-start)//2)
        record1 = recursiveFind(start,middle)
        record2 = recursiveFind((middle+1),end)
        record=record1+record2     
        return record
    else:
        return record

def actionOnNewKWissue(response,args,unFixID):
    
    kwIssueNum = len(response)

    if args.email :
        stdout = sys.stdout
        sys.stdout = stdOutfile = StringIO.StringIO()
        
    mailSubject = '[Notice!] The new klocwork issue betwean: {} and {}'.format(args.lastTag,args.releaseTag)
    unFixIssue= OrderedDict()
    
    #get the releaseTag buildnumber
    qury = {"releaseTag":args.releaseTag}
    record = findInServerDB(qury)
    maxBuildNumber = record[0]['buildNumber']
    
    #get the lastTag buildnumber
    qury = {"releaseTag":args.lastTag}
    record = findInServerDB(qury)
    minBuildNumber = record[0]['buildNumber']
    
    #find the all the db record between the two tag
    records = recursiveFind(minBuildNumber,maxBuildNumber)
    
    for record in records:
        for ID in record['issueIDs']:
            engineerName = record['engineerName']
            if ID in unFixID:
                if unFixIssue.has_key(engineerName):
                    unFixIssue[engineerName]['number']=unFixIssue[engineerName]['number']+1;
                    unFixIssue[engineerName]['unFixID'].append(ID)
                else: 
                    info = OrderedDict()
                    info['number']=1
                    info['unFixID']=[]
                    info['unFixID'].append(ID)
                    unFixIssue[engineerName]=info
    #print the issue info
    for engineerName in unFixIssue.keys():
        issueCnt = unFixIssue[engineerName]['number']
        issueIDs = unFixIssue[engineerName]['unFixID']
        klocworkMsg='\n{}: total {} klocworkIssue unfixed \n issueID:  {}'.format(engineerName,issueCnt,issueIDs)            
        print klocworkMsg
        
    if  args.email :
        sys.stdout = stdout #recover sys.stdout  
        name = args.email.split('@')[0]
        sendEmail(name,args.email,stdOutfile.getvalue(),mailSubject); 
        
def fetchIssueFromKlocworkWeb(query):    

    kwapi = klocworkapi(HOST,PORT,USER,TOKEN)
    kwapi.setParameter("project",PROJECT)
    kwapi.setParameter("action","search")
    kwapi.setParameter("query",query)
    
    res =kwapi.urlRequest()
     
    response=[]
    issueID =[]
    for record in res :
        issue=json.loads(record, object_hook=from_json)
        response.append(issue)
        issueID.append(issue.id)
    return (response,issueID)

def fetchBuildListFromKlocworkWeb():
    
    kwapi = klocworkapi(HOST,PORT,USER,TOKEN)
    kwapi.setParameter("project",PROJECT)
    kwapi.setParameter("action","builds")
    
    res =kwapi.urlRequest()
     
    buildList =[]
    for record in res :
        build=json.loads(record)
        buildList.append(build["name"])
        
    return buildList


def actionOnAuditMode(args):
    #REPT_I02.07.01.84 convert to REPT_I02_07_01_84
    newbuild = args.releaseTag.replace('.','_')
    oldbuild = args.lastTag.replace('.','_')
    query = "state:+'{}' diff:'{}','{}'".format(args.state,oldbuild,newbuild)
    response,issueID = fetchIssueFromKlocworkWeb(query)

    if len(response)>0:
        actionOnNewKWissue(response,args,issueID)
    else:
        if args.email :
            mailSubject = '[Notice!] No new klocwork issue betwean: {} and {}'.format(args.lastTag,args.releaseTag)
            name = args.email.split('@')[0]
            sendEmail(name,args.email,"",mailSubject); 
            
def getParameterValue(buildInfo, paramName):
    
    if not buildInfo or not buildInfo.get("actions"): 
        return;
    
    for action in buildInfo["actions"]:
        print paramName
        if action.get("parameters"):
            for param in action["parameters"]:
                if param["name"] == paramName:
                    return param["value"]
    return;
            
def actionOnCIMode(args):
    from jenkins import Jenkins
    from jenkins import JenkinsException
    sys.path.append('/opt/booster_project/script/boosterSocket/')
    sys.path.append('/opt/booster_project/script/jenkins/')
    from boosterSocket import sendEmail
    from parseJenkinsBuildHistory import BoosterJenkins,BoosterDB
    
    jenkinsServer = BoosterJenkins(JENKINS_URL, JENKINS_USERNAME, JENKINS_TOKEN)
    dbClient = MongoClient()
    db = BoosterDB(dbClient, BOOSTER_DB_NAME)
    #get jobinfo
    jobInfo = jenkinsServer.getJobInfo(KW_JOB)
    
    #get build list in klocwork web 
    buildList = fetchBuildListFromKlocworkWeb()
    
    firstBuildNum = jobInfo['firstBuild']['number'] if 'firstBuild' in jobInfo else 0
    lastBuildNum = jobInfo['lastCompletedBuild']['number'] if 'lastCompletedBuild' in jobInfo else 0
    lastBuildSaved = db.getLastBuildInfo(CI_KW_COLL_NAME,"buildNumber")

    start = (lastBuildSaved['buildNumber']+1) if lastBuildSaved else firstBuildNum
    end = lastBuildNum
    while start <= end:
        buildInfo = jenkinsServer.getBuildInfo(KW_JOB, start)
        print '\tProcess build [{}, {}]'.format(KW_JOB, start)
        
        if buildInfo:
            releaseTag=getParameterValue(buildInfo,'NEW_BASELINE')
            
            if re.match(r'REPT_I02.*', releaseTag):
                result = buildInfo['result']
                email =getParameterValue(buildInfo,'EMAIL')
                submitter = getParameterValue(buildInfo,'SUBMITTER')
                record= {"releaseTag":releaseTag,"buildNumber":buildInfo['number'],"engineerName":submitter,"engineerMail":email,"date":buildInfo['timestamp'],"buildWarningCnt":0,"issueIDs":[]};
                
                kwbuild=releaseTag.replace(".","_")
                if (result == 'SUCCESS') and (kwbuild in buildList):
                #save data to database and send email to author if issue number is not 0
                    #kwbuild = 'REPT_I02_07_02_49'
                    queryNew = "build:'{}' state:+New".format(kwbuild)
                    queryFix = "build:'{}' state:+Fixed".format(kwbuild)
                    responseNew,issueIDNew = fetchIssueFromKlocworkWeb(queryNew)

                    record["klocworkCnt"]=len(issueIDNew)
                    record["issueIDs"] = issueIDNew
                    if len(issueIDNew)!=0:
                        arrdic = convert_to_dicts(responseNew)
                        record["details"] = arrdic
                    db.insertOne(CI_KW_COLL_NAME, record) 
                        
                    responseFix,issueIDFix = fetchIssueFromKlocworkWeb(queryFix)
                    
                    #send email
                    if email:
                        stdout = sys.stdout
                        sys.stdout = stdOutfile = StringIO.StringIO()
                        emailSubject =  '[Notice!] You introduced {} new klocwork issue,Fixed {} klocwork issue on :  {}'.format(len(issueIDNew),len(issueIDFix),releaseTag)
                    if len(issueIDNew)!=0:
                        print "\n The new klockwork issue you introduced:"
                        print issueIDNew
                        for issue in responseNew:
                            print issue
                    if len(issueIDFix)!=0:
                        print "\n the issue ids you fixed:\n"
                        print issueIDFix
                    if email :
                        sys.stdout = stdout #recover sys.stdout  
                        if len(issueIDNew)!=0 or len(issueIDFix)!=0:
                            #sendEmail(submitter,email,stdOutfile.getvalue(),emailSubject);
                            sendEmail(submitter,email,stdOutfile.getvalue(),emailSubject);
                else :
                #send email to booster team 
                    record["klocworkCnt"]='jenkinsFail'
                    db.insertOne(CI_KW_COLL_NAME, record)
                    emailSubject = "[Notice!]jenkins klocwork job is "+result 
                    msg = "jenkins klocwork job is "+ result +" on:" + releaseTag;
                    if result == "SUCCESS":
                        msg = "{}\n but there is no build info on klockwork web".format(msg)
                    sendEmail("booster","boosterTeam@motorolasolutions.com",msg,emailSubject);
        start += 1
 
            
def process_argument():
    parser = argparse.ArgumentParser(description="description:get the klocwork issue info", epilog=" %(prog)s description end")
    parser.add_argument('-r',dest="releaseTag")
    parser.add_argument('-l',dest="lastTag")
    parser.add_argument('-s',dest="state")
    parser.add_argument('-e',dest="email")
    parser.add_argument('-m',dest="mode",required = True)
    
    args = parser.parse_args()

    return args
if __name__ == "__main__":
    
    args = process_argument()
    
    if args.mode == "audit":
        #sys.path.append('/vagrant/booster_project/script/boosterSocket/')
        from boosterSocket import BoosterClient,sendEmail,WarnKlocFindResult
        actionOnAuditMode(args)
    elif args.mode == "CI":
        try:
            ssl._create_default_https_context = ssl._create_unverified_context
        except AttributeError:
            pass
        actionOnCIMode(args)


