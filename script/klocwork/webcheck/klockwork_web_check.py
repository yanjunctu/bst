# -*- coding: utf-8 -*-

import urllib, urllib2, json, sys, os.path, getpass, time
import re
import argparse
from urllib2 import HTTPError
from collections import OrderedDict
import StringIO
from pymongo import MongoClient
import math
import ssl
from jenkins import Jenkins
from jenkins import JenkinsException
sys.path.append('/opt/booster_project/script/boosterSocket/')
sys.path.append('/opt/booster_project/script/jenkins/')
from sendEmail import sendEmail
from parseJenkinsBuildHistory import BoosterJenkins,BoosterDB

#klocwork
HOST = '10.193.226.186'
PORT = 8080
USER = 'huang rurong-QPCB36'
TOKEN = '3ce1d76aae49dc433da70c546f634b25f8734d9a59490831c41f8b261fe0e57e'
PROJECT = ['REPT2.7','REPT_MAIN']
#jenkins
JENKINS_URL = 'https://cars.ap.mot-solutions.com:8080'
JENKINS_USERNAME = 'jhv384'
JENKINS_TOKEN = '4aff12c2c2c0fba8342186ef0fd9e60c'
KW_JOB = "PCR-REPT-Git-KW"
CI_KW_JOB_COLL = "CI-PCR-REPT-Git-KW"
CI_RELEASE_JOB_COLL = "CI-PCR-REPT-Git-Release"
#data base
CI_KW_COLL_NAME = "klocwork";
BOOSTER_DB_NAME = 'booster'

AUDIT_TIME = 14*24*60*60*1000 #14 days

WelcomeWords = '''
\n############################
you should fix the issue in time,otherwise CI system will tag it as audit finding. and the issue allowed exist time is {} days   \n############################
'''.format(AUDIT_TIME/(24*60*60*1000))

managerEmail=["anlon.lee@motorolasolutions.com","xiao-fan.zhang@motorolasolutions.com","mengge.duan@motorolasolutions.com"]

class klocworkapi(object):
    def __init__(self, host,port,user,token):
        self.url = 'http://%s:%d/review/api' % (host, port)
        self.values = {"user": user,"ltoken":token}
        
    def setParameter(self,key,value):       
        self.values[key] = value
        
    def urlRequest(self): 

        data = urllib.urlencode(self.values)
        req = urllib2.Request(self.url, data)
        response = ""
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

        
def fetchIssueFromKlocworkWeb(project,query):    

    kwapi = klocworkapi(HOST,PORT,USER,TOKEN)
    kwapi.setParameter("project",project)
    kwapi.setParameter("action","search")
    kwapi.setParameter("query",query)
    
    res =kwapi.urlRequest()
     
    response=[]
    issueID =[]
    csaIssueID=[]
    for record in res :
        issue=json.loads(record, object_hook=from_json)
        response.append(issue)
        if "\\pcr_csa\\" in issue.file:
            csaIssueID.append(issue.id)
        else:
            issueID.append(issue.id)
    return (response,issueID,csaIssueID)

def fetchBuildListFromKlocworkWeb(project):
    
    kwapi = klocworkapi(HOST,PORT,USER,TOKEN)
    kwapi.setParameter("project",project)
    kwapi.setParameter("action","builds")
    
    res =kwapi.urlRequest()
     
    buildList =[]
    for record in res :
        build=json.loads(record)
        buildList.append(build["name"])
        
    return buildList


def actionOnAuditMode(args):
    ######
    #1.get the existing issue from kw
    #####
    dbClient = MongoClient()
    db = dbClient[BOOSTER_DB_NAME]
    #get the newest klocwork 
    docs = db[CI_KW_COLL_NAME].find({"PROJECT_NAME":args.project}).sort("buildNumber",-1)

    newestTag = docs[0]['releaseTag']
    newestbuild = newestTag.replace('.','_')
    query = "build:'{}' state:+'{}'".format(newestbuild,args.state)
    #get the existing issue
    response,existIssueID,csaIssueID= fetchIssueFromKlocworkWeb(args.project,query)

    ######
    #2.get the unfixed issue from db
    ######

    docs = db[CI_KW_COLL_NAME].find({'releaseTag':args.baseline})
    oldestDate = docs[0]['date']

    #issueDocs = db[CI_KW_COLL_NAME].find({'date':{'$gte':oldestDate},'status':{'$in',['new','audit']}})
    issueDocs = db[CI_KW_COLL_NAME].find({'$and':[{"PROJECT_NAME":args.project},{'date':{'$gte':oldestDate},'$or':[{'status':'existing'},{'status':'audit'}]}]})
    ######
    #3.get the intersection between step1 and step2
    ######
 
    if not issueDocs or not existIssueID:
        return

    auditInfo = actionOnIntersection(existIssueID,issueDocs,db)
                              
    ######
    #4.send email
    ######
    print auditInfo
    send_email(auditInfo)
    
def actionOnIntersection(existIssueID,issueDocs,db): 

    existIssueID = set(existIssueID)
    nowTime = time.time()*1000
    auditInfo= OrderedDict()
   
    for doc in issueDocs:
        
        ID = set(doc['issueIDs'])
        issueExistTime = (nowTime - doc["date"])
        unfixIssue = ID & existIssueID;
        fixedIssue = ID - unfixIssue;
        unfixIssue = list(unfixIssue)
        fixedIssue = list(fixedIssue)
   
        if len(unfixIssue)>0:
           
            engineerName = doc['engineerName']
            date = doc['date']
            detail = {"releaseTag":doc['releaseTag'],"existTime":issueExistTime,"issueID":unfixIssue}
            if auditInfo.has_key(engineerName):
                auditInfo[engineerName]['number']=auditInfo[engineerName]['number']+len(unfixIssue);
                auditInfo[engineerName]['detail'].append(detail)
            else: 
                info = OrderedDict()
                info['number']=1
                info['detail']=[]
                info['detail'].append(detail)
                auditInfo[engineerName]=info
        #update db
        if len(unfixIssue)>0 or len(fixedIssue)>0:
            state = doc["status"]
            auditIssue =doc["auditIDs"]
            if len(unfixIssue)==0:
                # no issue left
                if state == 'audit':
                    state = "audit_fixed"
                else:
                    state = "fixed"     
            else:
                
                if (issueExistTime > AUDIT_TIME) and (doc["status"]!='audit' and doc["status"]!='audit_fixed') :
                    #time expire
                    state = "audit"
                    auditIssue = list(set(auditIssue)|set(unfixIssue))
            
            fixedIssue = list(set(fixedIssue)|set(doc["fixedIDs"]))
           
            db[CI_KW_COLL_NAME].update_one({"releaseTag":doc['releaseTag']},{"$set":{"status":state,"issueIDs":unfixIssue,"fixedIDs":fixedIssue,"auditIDs":auditIssue}})
                          
    return auditInfo
                          
def send_email(auditInfo):
    for engineerName in auditInfo.keys():
        stdout = sys.stdout
        sys.stdout = stdOutfile = StringIO.StringIO()
        audit = False
        emailAdr = []
            
        issueCnt = auditInfo[engineerName]['number']
        mailSubject = "{} you have total {} klocworkIssue unfixed".format(engineerName,issueCnt)
        print WelcomeWords
                              
        for issueDetail in auditInfo[engineerName]['detail']:
            existdays =  issueDetail["existTime"]/(24*60*60*1000)           
            print "\n {}: unfixed issue:{},   Exist : {}, days".format(issueDetail['releaseTag'],issueDetail["issueID"],round(existdays))
                            
            if issueDetail["existTime"] > AUDIT_TIME:
                print "those issue exceed the time limit {}，and already be node down".format(AUDIT_TIME/24/60/60/1000)
                audit = True

        if audit:
            for mail in managerEmail:
                emailAdr.append(mail)
    
        engineerNameEmail="{}@motorolasolutions.com".format(engineerName)                     
        emailAdr.append(engineerNameEmail)
  
        sendEmail(engineerName,emailAdr,stdOutfile.getvalue(),mailSubject);
        sys.stdout = stdout
            
def getParameterValue(buildInfo, paramName):
    
    if not buildInfo or not buildInfo.get("actions"): 
        return;
    
    for action in buildInfo["actions"]:

        if action.get("parameters"):
            for param in action["parameters"]:
                if param["name"] == paramName:
                    return param["value"]
    return;
def getSubEmail(db,coll,releaseTag):
    obj = {"name": "NEW_BASELINE", "value": releaseTag};
    condition ={"actions.parameters": {'$in': [obj]}}
    sortType=('number',-1)
    docs = db.findInfo(coll,condition,sortType)
    if len(docs)>0:
        return getParameterValue(docs[0], 'EMAIL')
            
def actionOnCIMode(args):
    jenkinsServer = BoosterJenkins(JENKINS_URL, JENKINS_USERNAME, JENKINS_TOKEN)
    dbClient = MongoClient()
    db = BoosterDB(dbClient, BOOSTER_DB_NAME)
    #get jobinfo
    jobInfo = jenkinsServer.getJobInfo(KW_JOB)
    
    #get build list in klocwork web 
    buildList={}
    for project in PROJECT:
        buildList[project] = fetchBuildListFromKlocworkWeb(project)
    
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
            projectName =getParameterValue(buildInfo,'PROJECT_NAME')
            
            if re.match(r'REPT_[DI]02.*', releaseTag):
                result = buildInfo['result']
                #the klowwork job in jenkins do not content the submitter info,need get the submitter info from db
                
                email =getSubEmail(db,CI_RELEASE_JOB_COLL,releaseTag)
                if not email:
                    email = "boosterTeam@motorolasolutions"
                submitter = email.split("@")[0];
                record= {"releaseTag":releaseTag,"buildNumber":buildInfo['number'],"engineerName":submitter,"engineerMail":email,"date":time.time()*1000,"issueIDs":[],"PROJECT_NAME":projectName,"fixedIDs":[],"ignoreIDs":[],"status":"existing","auditIDs":[]};
                
                kwbuild=releaseTag.replace(".","_")
                if (result == 'SUCCESS') and (kwbuild in buildList[projectName]):
                #save data to database and send email to author if issue number is not 0
                    #kwbuild = 'REPT_I02_07_02_49'
                    queryNew = "build:'{}' state:+New".format(kwbuild)
                    queryFix = "build:'{}' state:+Fixed".format(kwbuild)
                    responseNew,issueIDNew,csaIssueIDNew = fetchIssueFromKlocworkWeb(projectName,queryNew)

                    record["klocworkCnt"]=len(issueIDNew)+len(csaIssueIDNew)
                    record["issueIDs"] = issueIDNew
                    record["csaIssueIDs"] = csaIssueIDNew
                    if len(issueIDNew)!=0:
                        arrdic = convert_to_dicts(responseNew)
                        record["details"] = arrdic
                    db.insertOne(CI_KW_COLL_NAME, record) 
                        
                    responseFix,issueIDFix,csaIssueTDFix = fetchIssueFromKlocworkWeb(projectName,queryFix)
                    
                    #send email
                    if email:
                        stdout = sys.stdout
                        sys.stdout = stdOutfile = StringIO.StringIO()
                        emailSubject =  '[Notice!] You introduced {} new klocwork issue,Fixed {} klocwork issue on :  {}'.format(len(issueIDNew)+len(csaIssueIDNew),len(issueIDFix),releaseTag)
                    if record["klocworkCnt"]!=0:
                        print "\n The new klockwork issue you introduced:"
                        print issueIDNew
                        print csaIssueIDNew
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
    parser.add_argument('-b',dest="baseline",default ="REPT_I02.07.03.49")
    #parser.add_argument('-b',dest="baseline",default ="REPT_I02.07.06.05")
    
    parser.add_argument('-s',dest="state",default="Existing,+New")
    parser.add_argument('-e',dest="email")
    #the unit is day
    parser.add_argument('-D',dest="pdays",default = 7,type=int)
    parser.add_argument('-m',dest="mode",choices=['audit', 'CI'],required = True)
    parser.add_argument('-prj',dest="project",default = "REPT_MAIN")
    
    args = parser.parse_args()

    return args
if __name__ == "__main__":
    
    args = process_argument()
        
    if args.mode == "audit":
        actionOnAuditMode(args)
    elif args.mode == "CI":
        try:
            ssl._create_default_https_context = ssl._create_unverified_context
        except AttributeError:
            pass
        actionOnCIMode(args)


