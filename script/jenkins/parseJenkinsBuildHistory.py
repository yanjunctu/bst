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

#---------------------------------------------------------------------------------------------------------------
# define class BoosterJenkins  Inherite from class Jenkins
#----------------------------------------------------------------------------------------------------------------
class BoosterJenkins(Jenkins):
    def __init__(self, url, username=None, password=None):
      Jenkins.__init__(self,url,username,password)
        
    def get_job_all_builds(self, name):
        ''' To prevent Jenkins from having to load all builds from disk, normally only return 50 builds, if have to retrieve all,
            add ?tree=allBuilds[]
        '''
        
        folder_url, short_name = self._get_job_folder(name)
       
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
#-----------------------------------------------------------------------------------------------------------
# define class BoosterJenkins end
#------------------------------------------------------------------------------------------------------------
#-----------------------------------------------------------------------------------------------------------
# define class job list handler
#------------------------------------------------------------------------------------------------------------
class jobList(object):
    def __init__(self, xmlfile):
        try:
            self.xmlfile = xmlfile
            self.tree = ET.parse(self.xmlfile) 
            self.root = self.tree.getroot()
        except Exception, e:
            print "Error:cannot parse file:{}".format(xmlfile)
            sys.exit(1) 
        self.currentJob=None
    def setCurrenJobNode(self,currentJob):
        self.currentJobNode = currentJob
        
    def check_node_text_exist(self,parentNode,childNode,newNodepara):
        for child in parentNode.findall(childNode):
            if newNodepara == child.text:
                return True
        return False
            
    def check_node_attrib_exist(self,parentNode,childNode,attribType,newNodepara):
        for child in parentNode.findall(childNode):
            if newNodepara == child.attrib[attribType]:
                return True
        return False
    
    def update(self,newNodename):
            #update the joblist.xml
            if not self.check_node_text_exist(self.currentJobNode,"subJob",newNodename):
                SubElement(self.currentJobNode,"subJob").text = newNodename
                #add a subelemnt to root
                if not self.check_node_attrib_exist(self.root,"job","title",newNodename):
                    item=SubElement(self.root,"job",{"title":newNodename})
                    SubElement(item,"name").text = newNodename
                    self.tree.write(self.xmlfile)
                    
#-----------------------------------------------------------------------------------------------------------
# define class job list handler end
#------------------------------------------------------------------------------------------------------------

#-----------------------------------------------------------------------------------------------------------
# define class jenkins data
#------------------------------------------------------------------------------------------------------------
class JenkinsDataXLS(object):
    def __init__(self,jobListRoot,jenkins_file_dir):
        if False == os.path.exists(jenkins_file_dir):
            self.JenkinsFileCreate(jobListRoot)
        self.jenkinsFileDir= jenkins_file_dir  
        self.jenkinsFileObj = open_workbook(self.jenkinsFileDir,formatting_info=True)
        self.jenkinsFileObjCP = copy(self.jenkinsFileObj)
    
    def JenkinsFileCreate(self,jobListRoot):
        # create workbook instance and setup title in first row
        wb = xlwt.Workbook()
        
        warnings ={}

        for job in jobListRoot.findall('job'):
        
            #init excel sheet handler
            sheetName = job.attrib['title']
            xlsHandler= wb.add_sheet(sheetName)

            # write title firstly
            self.createTitle(xlsHandler) 
            # write the subBuilds title
            col=SUBSTART_COL
            for sub in job.findall('subJob'):
            
                xlsHandler.write(0, col, sub.text)
                col+=1
      
        wb.save(JENKINS_FILE_DIR)

    def createTitle(self,xlsHandler):

        xlsHandler.write(0, ID_COL, 'build id')
        xlsHandler.write(0, PROJNA_COL, 'project name')
        xlsHandler.write(0, SUBMIT_COL, 'submitter')
        xlsHandler.write(0, PUSHT_COL, 'push time')    
        xlsHandler.write(0, START_COL, 'start time')
        xlsHandler.write(0, DUR_COL, 'build duration')
        xlsHandler.write(0, RESULT_COL, 'build result') 
        
    def timeConvert(self,origTime):
        x = origTime / 1000
        seconds = x % 60
        x /= 60
        minutes = x % 60
        x /= 60
        hours = x % 24
        converTime = "%d:%d:%d"%(hours,minutes,seconds)
        return converTime
            
    def dataSave(self,joblistXML):
    
        #jenkins_url = 'https://cars01:8080'
        jenkins_url = 'https://10.193.226.152:8080'
        # password is use token 
        jenkinsServer = BoosterJenkins(jenkins_url, username='jhv384', password='4aff12c2c2c0fba8342186ef0fd9e60c')

        for job in joblistXML.root.findall('job'):
            #init excel sheet handler
            sheetName = job.attrib['title']
            #get excel sheet handler
            try:
                sheetHandler = self.jenkinsFileObj.sheet_by_name(sheetName)
            except:
                print 'no sheet named {}'.format(sheetName)
                continue
            print 'open sheet {}'.format(sheetName)
            sheetHandlerCP = self.jenkinsFileObjCP.get_sheet(self.jenkinsFileObj.sheet_names().index(sheetName)) 
            #get the rows number
            rows_num = sheetHandler.nrows
            cols_num =sheetHandler.ncols
            if 0 == rows_num:
                # file title not exist creat the file
                self.JenkinsFileCreate()
            elif 1 == rows_num:
                #only title 
                maxBuildId = 0;
            else:
                #get the last build id
                maxBuildId=sheetHandler.cell(rows_num-1,0).value

            #retrieve all builds info from jenkins
            jobname = job.find('name').text
 
            jobInfo = jenkinsServer.get_job_all_builds(jobname) 
            #write retrieved info into excel
            curExcelRow = rows_num
            buildArray = jobInfo["allBuilds"]
            lenBuildArray = len(buildArray)
            #print buildArray
    
            for buildIndex in range(lenBuildArray):
            # save id
                buildId = buildArray[lenBuildArray-buildIndex-1]["id"]
                print 'buildID:{},maxbuildID{}'.format(buildId,maxBuildId)
                if int(buildId) > int(maxBuildId):
                    print 'buildId>maxbuildid'
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
                    dur=self.timeConvert(buildArray[lenBuildArray-buildIndex-1]["duration"])
                    sheetHandlerCP.write(curExcelRow,DUR_COL,dur)
                    #save result 
                    sheetHandlerCP.write(curExcelRow,RESULT_COL,buildArray[lenBuildArray-buildIndex-1]["result"])

                    if buildArray[lenBuildArray-buildIndex-1].has_key("subBuilds"):
                        joblistXML.setCurrenJobNode(job)
                        isAddNewSub = self.saveSubBuilds(curExcelRow,cols_num,sheetHandlerCP,sheetHandler,buildArray[lenBuildArray-buildIndex-1]["subBuilds"],joblistXML)
                        if isAddNewSub:
                            self.updateJenkinsFile()
                            try:
                                sheetHandler = self.jenkinsFileObj.sheet_by_name(sheetName)
                            except:
                                print 'no sheet named {}'.format(sheetName)
                                continue
                            sheetHandlerCP = self.jenkinsFileObjCP.get_sheet(self.jenkinsFileObj.sheet_names().index(sheetName)) 
                            #get the rows number
                            rows_num = sheetHandler.nrows
                            cols_num =sheetHandler.ncols
                            if 0 == rows_num:
                                # file title not exist creat the file
                                self.JenkinsFileCreate()
                            elif 1 == rows_num:
                                #only title 
                                maxBuildId = 0;
                            else:
                                #get the last build id
                                maxBuildId=sheetHandler.cell(rows_num-1,0).value
                                
                    curExcelRow = curExcelRow+1  
        self.updateJenkinsFile()
    
    def updateJenkinsFile(self):
        os.remove(self.jenkinsFileDir)
        self.jenkinsFileObjCP.save(self.jenkinsFileDir) 
        #sys.exit(1) 
        self.jenkinsFileObj = open_workbook(self.jenkinsFileDir,formatting_info=True)
        self.jenkinsFileObjCP = copy(self.jenkinsFileObj)
        
    def saveSubBuilds(self,curExcelRow,cols_num,writeHandler,readHandler,subBuilds,joblistXML):
        write_cols_num = cols_num
        isAddNewSub = False
        for build in subBuilds:
            jobname = build["jobName"]
       
            isSubExist = False
            for i in range(SUBSTART_COL,cols_num):
        
                if readHandler.cell(0,i).value == jobname:
                    writeHandler.write(curExcelRow,i,build["buildNumber"])
                    isSubExist = True
            #if the subbuilds not exist in the sheet,need to add the subbuild to sheet and joblist
            if isSubExist == False:
                #update the workbook.xls
                writeHandler.write(0, write_cols_num, jobname)
                writeHandler.write(curExcelRow,cols_num,build["buildNumber"])
                write_cols_num = write_cols_num+1
                try:
                    xlsHandler= self.jenkinsFileObjCP.add_sheet(jobname)
                    # write title firstly
                    self.createTitle(xlsHandler)
                except:
                    print 'the sheet {} already exist'.format(jobname)
                
                #update the joblist.xml
                joblistXML.update(jobname)
                isAddNewSub = True
                #self.updateJenkinsFile()
        return isAddNewSub

#-----------------------------------------------------------------------------------------------------------
# define class jenkins data end
#------------------------------------------------------------------------------------------------------------                       

if __name__ == "__main__":
    
    #init joblist class
    joblistXML = jobList(JOBLIST_DIR)
    #init Jenkins Data class
    JenkinsData = JenkinsDataXLS(joblistXML.root,JENKINS_FILE_DIR)
    JenkinsData.dataSave(joblistXML)

