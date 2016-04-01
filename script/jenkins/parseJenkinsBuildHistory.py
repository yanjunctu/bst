#Below is dependency python lib needed by this script
#sudo pip install python-jenkins
#sudo pip install xlwt
#sudo pip install xlrd
#sudo pip install xlutils

try:
    import xml.etree.cElementTree as ET
    from xml.etree.cElementTree import ElementTree,SubElement
except ImportError:
    import xml.etree.ElementTree as ET
    from xml.etree.ElementTree import ElementTree,SubElement
    



 
from jenkins import Jenkins
from jenkins import JenkinsException
from six.moves.urllib.error import HTTPError
from six.moves.urllib.error import URLError
from six.moves.urllib.request import Request, urlopen
from six.moves.urllib.parse import quote, urlencode, urljoin, urlparse
import socket
import ssl
import pprint
import json
import xlwt
import datetime
import time

import sys
import os
import xmlrpclib
from xlrd import open_workbook
from xlutils.copy import copy



JOB_ALL_BUILDS_INFO = '%(folder_url)sjob/%(short_name)s/api/json?tree=allBuilds[id,timestamp,result,duration,subBuilds[*],actions[parameters[*]]]'

#JENKINS_FILE_DIR = '/var/opt/booster/jenkins.xls'
#JOBLIST_DIR='/var/opt/booster/JobList.xml'
JENKINS_FILE_DIR = 'D:\\GitRepos\\I_booster\\booster_project\\script\\jenkins\\jenkins.xls'
JOBLIST_DIR='D:\\GitRepos\\I_booster\\booster_project\\script\\jenkins\\JobList.xml'
#JENKINS_FILE_DIR = '/mnt/gitlabbackup/jenkins.xls'
ID_COL=0
PROJNA_COL=1
SUBMIT_COL=2
PUSHT_COL=3
START_COL=4
DUR_COL=5
RESULT_COL=6
SUBSTART_COL=7

global NEW_SHEET

# This line is needed as if our server will report SSL failure if SSL true
ssl._create_default_https_context = ssl._create_unverified_context

# Inherite from class Jenkins
class BoosterJenkins(Jenkins):
    def __init__(self, url, username=None, password=None):
      Jenkins.__init__(self,url,username,password)
        
    def get_job_all_builds(self, name):
        ''' To prevent Jenkins from having to load all builds from disk, normally only return 50 builds, if have to retrieve all,
            add ?tree=allBuilds[]
        '''
        
        folder_url, short_name = self._get_job_folder(name)
        print 'short_name:'+short_name
        try:
            response = self.jenkins_open(Request(
                self._build_url(JOB_ALL_BUILDS_INFO, locals())
            ))
            if response:
                return json.loads(response)
            else:
                raise JenkinsException('job[%s] does not exist' % name)
        except HTTPError:
            raise JenkinsException('job[%s] does not exist' % name)
        except ValueError:
            raise JenkinsException(
                "Could not parse JSON info for job[%s]" % name)
            
def JenkinsFileCreate():
    
    # create workbook instance and setup title in first row
    wb = xlwt.Workbook()
    try:
        tree = ET.parse(JOBLIST_DIR) 
        root = tree.getroot()
    except Exception, e:
        print "Error:cannot parse file:{}".format(JOBLIST_DIR)
        sys.exit(1) 
        
    warnings ={}

    for job in root.findall('job'):
        
        #init excel sheet handler
        sheetName = job.attrib['title']
        xlsHandler= wb.add_sheet(sheetName)

        # write title firstly
        xlsHandler.write(0, ID_COL, 'build id')
        xlsHandler.write(0, PROJNA_COL, 'project name')
        xlsHandler.write(0, SUBMIT_COL, 'submitter')
        xlsHandler.write(0, PUSHT_COL, 'push time')    
        xlsHandler.write(0, START_COL, 'start time')
        xlsHandler.write(0, DUR_COL, 'build duration')
        xlsHandler.write(0, RESULT_COL, 'build result') 
        # write the subBuilds title
        col=SUBSTART_COL
        for sub in job.findall('subJob'):
            
            xlsHandler.write(0, col, sub.text)
            col+=1
      
    wb.save(JENKINS_FILE_DIR)
    
def check_node_text_exist(parentNode,childNode,newNodepara):
    for child in parentNode.findall(childNode):
        if newNodepara == child.text:
            return True
    return False
            
def check_node_attrib_exist(parentNode,childNode,attribType,newNodepara):
    for child in parentNode.findall(childNode):
        if newNodepara == child.attrib[attribType]:
            return True
    return False 

def saveSubBuilds(curExcelRow,cols_num,writeHandler,readHandler,subBuilds,workbook,currentNode,tree):
    for build in subBuilds:
        jobname = build["jobName"]
        print 'subjobname:'+jobname
        isSubExist = False
        for i in range(SUBSTART_COL,cols_num):
            print 'callvalue:'+readHandler.cell(0,i).value
            if readHandler.cell(0,i).value == jobname:
                writeHandler.write(curExcelRow,i,build["buildNumber"])
                isSubExist = True
        print isSubExist
        #if the subbuilds not exist in the sheet,need to add the subbuild to sheet and joblist
        if isSubExist == False:
            #add the subbuild info to current job 
            writeHandler.write(0, cols_num, jobname)
            writeHandler.write(curExcelRow,cols_num,build["buildNumber"])
            #add to subJob to current node if the subJob not exist
            if not check_node_text_exist(currentNode,"subJob",jobname):
                SubElement(currentNode,"subJob").text = jobname
                #add a subelemnt to root
                root = tree.getroot()
                if not check_node_attrib_exist(root,"job","title",jobname):
                    item=SubElement(root,"job",{"title":jobname})
                    SubElement(item,"name").text = jobname
                    tree.write(JOBLIST_DIR)
            
            # add a sheet for the subbuild,for new one the jobname is sheetname
            try:
                xlsHandler= workbook.add_sheet(jobname)
                # write title firstly
                xlsHandler.write(0, ID_COL, 'build id')
                xlsHandler.write(0, PROJNA_COL, 'project name')
                xlsHandler.write(0, SUBMIT_COL, 'submitter')
                xlsHandler.write(0, PUSHT_COL, 'push time')    
                xlsHandler.write(0, START_COL, 'start time')
                xlsHandler.write(0, DUR_COL, 'build duration')
                xlsHandler.write(0, RESULT_COL, 'build result') 
            except:
                print 'the sheet already exist'

                
def timeConvert(origTime):
    x = origTime / 1000
    seconds = x % 60
    x /= 60
    minutes = x % 60
    x /= 60
    hours = x % 24
    converTime = "%d:%d:%d"%(hours,minutes,seconds)
    return converTime
                

def JenkinsDataSave():  
    
    #jenkins_url = 'https://cars01:8080'
    jenkins_url = 'https://10.193.226.152:8080'
    # password is use token 
    jenkinsServer = BoosterJenkins(jenkins_url, username='jhv384', password='4aff12c2c2c0fba8342186ef0fd9e60c')
    jenkinsFile = open_workbook(JENKINS_FILE_DIR,formatting_info=True)
    jenkinsFileCP = copy(jenkinsFile)
    try:
        tree = ET.parse(JOBLIST_DIR) 
        root = tree.getroot()
    except Exception, e:
        print "Error:cannot parse file:{}".format(buildLog)
        sys.exit(1)
    for job in root.findall('job'):
        #init excel sheet handler
        sheetName = job.attrib['title']
        print 'sheetname:'+sheetName
        #get excel sheet handler
        try:
            sheetHandler = jenkinsFile.sheet_by_name(sheetName)
        except:
            print 'no sheet named {}'.format(sheetName)
            continue
        #sheetHandlerCP = jenkinsFileCP.sheet_by_name(k)
        sheetHandlerCP = jenkinsFileCP.get_sheet(jenkinsFile.sheet_names().index(sheetName)) 
        #get the rows number
        rows_num = sheetHandler.nrows
        cols_num =sheetHandler.ncols
        if 0 == rows_num:
            # file title not exist creat the file
            JenkinsFileCreate()
        elif 1 == rows_num:
            #only title 
            maxBuildId = 0;
        else:
            #get the last build id
            maxBuildId=sheetHandler.cell(rows_num-1,0).value
        print 'maxBuildId:{}'.format(maxBuildId)
        #retrieve all builds info from jenkins
        jobname = job.find('name').text
        print 'jobname:'+jobname
        jobInfo = jenkinsServer.get_job_all_builds(jobname) 
        #write retrieved info into excel
        curExcelRow = rows_num
        buildArray = jobInfo["allBuilds"]
        lenBuildArray = len(buildArray)
        #print buildArray
    
        for buildIndex in range(lenBuildArray):
        # save id
            buildId = buildArray[lenBuildArray-buildIndex-1]["id"]
            print 'ID:'.format(buildId)
            if int(buildId) > int(maxBuildId):
                sheetHandlerCP.write(curExcelRow,ID_COL,buildId)
                submitter=None
                projName=None
                pushTime=None

                # get project name and submitter
                actions = buildArray[lenBuildArray-buildIndex-1]["actions"]
                for parameters in actions:
                    if parameters!= {}:
                        parameter=parameters["parameters"]
                        for para in parameter:
                            if para["name"]=="SUBMITTER":
                                submitter = para["value"]
                            elif para["name"]=="PROJECT_NAME":
                                projName =  para["value"]
                            elif para["name"]=="PUSH_TIME":
                                pushTime =  para["value"]
                print 'projName:{}'.format(projName)
                print 'submitter:{}'.format(submitter)
                sheetHandlerCP.write(curExcelRow,PROJNA_COL,projName)
                sheetHandlerCP.write(curExcelRow,SUBMIT_COL,submitter)
                #the origin push time's unit is second
                if (pushTime != None) and (pushTime != ""):
                    pushTime = time.strftime("%c", time.localtime(float(pushTime)/1000))
                sheetHandlerCP.write(curExcelRow,PUSHT_COL,pushTime)
                # save timestamp
                stamp = buildArray[lenBuildArray-buildIndex-1]["timestamp"]
                #print stamp
                stamp = time.strftime("%c", time.localtime(float(stamp)/1000))
                sheetHandlerCP.write(curExcelRow,START_COL,stamp)
                # save duration, duration unit is ms
                dur=timeConvert(buildArray[lenBuildArray-buildIndex-1]["duration"])
                sheetHandlerCP.write(curExcelRow,DUR_COL,dur)
                #save result 
                sheetHandlerCP.write(curExcelRow,RESULT_COL,buildArray[lenBuildArray-buildIndex-1]["result"])

                if buildArray[lenBuildArray-buildIndex-1].has_key("subBuilds"):
                    print 'looking for subBuilds'
                    saveSubBuilds(curExcelRow,cols_num,sheetHandlerCP,sheetHandler,buildArray[lenBuildArray-buildIndex-1]["subBuilds"],jenkinsFileCP,job,tree)
                curExcelRow = curExcelRow+1        
    os.remove(JENKINS_FILE_DIR)
    jenkinsFileCP.save(JENKINS_FILE_DIR)

if __name__ == "__main__":
   
    if False == os.path.exists(JENKINS_FILE_DIR):
        JenkinsFileCreate()
    
    JenkinsDataSave()

