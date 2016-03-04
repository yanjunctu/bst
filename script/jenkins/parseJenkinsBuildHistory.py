#Below is dependency python lib needed by this script
#sudo pip install python-jenkins
#sudo pip install xlwt
#sudo pip install xlrd
#sudo pip install xlutils


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

import os
from xlrd import open_workbook
from xlutils.copy import copy



JOB_ALL_BUILDS_INFO = '%(folder_url)sjob/%(short_name)s/api/json?tree=allBuilds[id,timestamp,result,duration,subBuilds[*],actions[parameters[*]]]'



JOBS = {
"emerald_multiJob":{"name":u"PCR-REPT-0-MultiJob-Emerald","xlsHandler":None,"subBuilds":[u"PCR-REPT-Git-Integration",u"PCR-REPT-On_Target_MultiJob",u"PCR-REPT-Off_Target_MultiJob"]},	
"nonEmerald_multiJob":{"name":u"PCR-REPT-0-MultiJob-nonEmerald","xlsHandler":None,"subBuilds":[u"PCR-REPT-Git-Integration",u"PCR-REPT-On_Target_MultiJob",u"PCR-REPT-Off_Target_MultiJob"]},
"pre_check_job":{"name":u"PCR-REPT-Git-Integration","xlsHandler":None,"subBuilds":None},	
"onTarget_multiJob":{"name":u"PCR-REPT-On_Target_MultiJob","xlsHandler":None,"subBuilds":[u"PCR-REPT-On_Target_Build_MultiJob",u"PCR-REPT-On_Target_Test_MultiJob"]},	
"onTarget_build_multiJob":{"name":u"PCR-REPT-On_Target_Build_MultiJob","xlsHandler":None,"subBuilds":[u"PCR-REPT-Bahama_Matrix_ARM_Build",u"PCR-REPT-Bahama_DSP_Build",u"PCR-REPT-Cypher_Matrix32_ARM32_Build",u"PCR-REPT-Cypher_DSP32_Build",u"PCR-REPT-Cypher_Matrix8_ARM8_Build",u"PCR-REPT-Cypher_DSP8_Build"]},
"onTarget_build_bahama_arm_job":{"name":u"PCR-REPT-Bahama_Matrix_ARM_Build","xlsHandler":None,"subBuilds":None},
"onTarget_build_bahama_dsp_job":{"name":u"PCR-REPT-Bahama_DSP_Build","xlsHandler":None,"subBuilds":None,"subBuilds":None},
"onTarget_build_cypher32_arm_job":{"name":u"PCR-REPT-Cypher_Matrix32_ARM32_Build","xlsHandler":None,"subBuilds":None},
"onTarget_build_cypher32_dsp_job":{"name":u"PCR-REPT-Cypher_DSP32_Build","xlsHandler":None,"subBuilds":None},
"onTarget_build_cypher8_arm_job":{"name":u"PCR-REPT-Cypher_Matrix8_ARM8_Build","xlsHandler":None,"subBuilds":None},
"onTarget_build_cypher8_dsp_job":{"name":u"PCR-REPT-Cypher_DSP8_Build","xlsHandler":None,"subBuilds":None},	
"onTarget_test_multijob":{"name":u"PCR-REPT-On_Target_Test_MultiJob","xlsHandler":None,"subBuilds":[u"PCR-REPT-DAT"]},
"dat_job":{"name":u"PCR-REPT-DAT","xlsHandler":None,"subBuilds":[u"PCR-REPT-DAT_REAL"]},
"dat_real_job":{"name":u"PCR-REPT-DAT_REAL","xlsHandler":None,"subBuilds":None},
"offTarget_multi_job":{"name":u"PCR-REPT-Off_Target_MultiJob","xlsHandler":None,"subBuilds":[u"PCR-REPT-Off_Target_Build_MultiJob",u"PCR-REPT-Off_Target_Test_MultiJob"]},
"offTarget_build_job":{"name":u"PCR-REPT-Off_Target_Build_MultiJob","xlsHandler":None,"subBuilds":[u"PCR-REPT-Cypher_Win32_Build"]},	
"cypher_win32_build_job":{"name":u"PCR-REPT-Cypher_Win32_Build","xlsHandler":None,"subBuilds":None},
"offTarget_test_multiJob":{"name":u"PCR-REPT-Off_Target_Test_MultiJob","xlsHandler":None,"subBuilds":[u"PCR-REPT-Win32_UT",u"PCR-REPT-Win32_IT"]},
"offTarget_test_ut_job":{"name":u"PCR-REPT-Win32_UT","xlsHandler":None,"subBuilds":None},
"offTarget_test_it_job":{"name":u"PCR-REPT-Win32_IT","xlsHandler":None,"subBuilds":None},
}

#JENKINS_FILE_DIR = '/var/opt/booster/jenkins.xls'
JENKINS_FILE_DIR = 'D:/GitRepos/webBox/booster_project/script/jenkins/jenkins.xls'
ID_COL=0
PROJNA_COL=1
SUBMIT_COL=2
PUSHT_COL=3
START_COL=4
DUR_COL=5
RESULT_COL=6
SUBSTART_COL=7

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
  for k in JOBS:
    #init excel sheet handler
    JOBS[k]["xlsHandler"] = wb.add_sheet(k)

    # write title firstly
    JOBS[k]["xlsHandler"].write(0, ID_COL, 'build id')
    JOBS[k]["xlsHandler"].write(0, PROJNA_COL, 'project name')
    JOBS[k]["xlsHandler"].write(0, SUBMIT_COL, 'submitter')
    JOBS[k]["xlsHandler"].write(0, PUSHT_COL, 'push time')	
    JOBS[k]["xlsHandler"].write(0, START_COL, 'start time')
    JOBS[k]["xlsHandler"].write(0, DUR_COL, 'build duration')
    JOBS[k]["xlsHandler"].write(0, RESULT_COL, 'build result') 
	# write the subBuilds title
    col=SUBSTART_COL
    if JOBS[k]["subBuilds"]!= None:
      for sub in JOBS[k]["subBuilds"]:
        JOBS[k]["xlsHandler"].write(0, col, sub)
        col+=1
	  
  wb.save(JENKINS_FILE_DIR)


def saveSubBuilds(curExcelRow,cols_num,writeHandler,readHandler,subBuilds):
	for build in subBuilds:
		jobname = build["jobName"]
		for i in range(SUBSTART_COL,cols_num):
			if readHandler.cell(0,i).value == jobname:
				writeHandler.write(curExcelRow,i,build["buildNumber"])

				
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
	
  jenkins_url = 'https://cars01:8080'
  # password is use token 
  jenkinsServer = BoosterJenkins(jenkins_url, username='jhv384', password='4aff12c2c2c0fba8342186ef0fd9e60c')
  jenkinsFile = open_workbook(JENKINS_FILE_DIR,formatting_info=True)
  jenkinsFileCP = copy(jenkinsFile)
  for k in JOBS:
    #get excel sheet handler
	sheetHandler = jenkinsFile.sheet_by_name(k)
	#sheetHandlerCP = jenkinsFileCP.sheet_by_name(k)
	sheetHandlerCP = jenkinsFileCP.get_sheet(jenkinsFile.sheet_names().index(k)) 
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
	
    #retrieve all builds info from jenkins
	jobInfo = jenkinsServer.get_job_all_builds(JOBS[k]["name"]) 
    #write retrieved info into excel
	curExcelRow = rows_num
	buildArray = jobInfo["allBuilds"]
	lenBuildArray = len(buildArray)
    #print buildArray
	
	for buildIndex in range(lenBuildArray):
      # save id
		buildId = buildArray[lenBuildArray-buildIndex-1]["id"]
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
			sheetHandlerCP.write(curExcelRow,PROJNA_COL,projName)
			sheetHandlerCP.write(curExcelRow,SUBMIT_COL,submitter)
			#the origin push time's unit is second
			if pushTime != None:
				pushTime = time.strftime("%c", time.localtime(pushTime)/1000)
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
				saveSubBuilds(curExcelRow,cols_num,sheetHandlerCP,sheetHandler,buildArray[lenBuildArray-buildIndex-1]["subBuilds"])
			curExcelRow = curExcelRow+1
		
  os.remove(JENKINS_FILE_DIR)
  jenkinsFileCP.save(JENKINS_FILE_DIR)

if __name__ == "__main__":
   
  if False == os.path.exists(JENKINS_FILE_DIR):
    JenkinsFileCreate()
	
  JenkinsDataSave()

