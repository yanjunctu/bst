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


JOB_ALL_BUILDS_INFO = '%(folder_url)sjob/%(short_name)s/api/json?tree=allBuilds[id,timestamp,result,duration]'

JOBS = {
"pre_check_job":{"name":u"PCR-REPT-Git-Integration","xlsHandler":None},
"onTarget_build_bahama_arm_job":{"name":u"PCR-REPT-Bahama_Matrix_ARM_Build","xlsHandler":None},
"onTarget_build_bahama_dsp_job":{"name":u"PCR-REPT-Bahama_DSP_Build","xlsHandler":None},
"onTarget_build_cypher32_arm_job":{"name":u"PCR-REPT-Cypher_Matrix32_ARM32_Build","xlsHandler":None},
"onTarget_build_cypher32_dsp_job":{"name":u"PCR-REPT-Cypher_DSP32_Build","xlsHandler":None},
"onTarget_build_cypher8_arm_job":{"name":u"PCR-REPT-Cypher_Matrix8_ARM8_Build","xlsHandler":None},
"onTarget_build_cypher8_dsp_job":{"name":u"PCR-REPT-Cypher_DSP8_Build","xlsHandler":None},
"offTarget_build_job":{"name":u"PCR-REPT-Cypher_Win32_Build","xlsHandler":None},
"offTarget_test_ut_job":{"name":u"PCR-REPT-Win32_UT","xlsHandler":None},
"offTarget_test_it_job":{"name":u"PCR-REPT-Win32_IT","xlsHandler":None},
}

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

if __name__ == "__main__":
  
  jenkins_url = 'https://cars01:8080'
  # password is use token 
  jenkinsServer = BoosterJenkins(jenkins_url, username='jhv384', password='4aff12c2c2c0fba8342186ef0fd9e60c')
  
  # create workbook instance and setup title in first row
  wb = xlwt.Workbook()

  for k in JOBS:
    #init excel sheet handler
    JOBS[k]["xlsHandler"] = wb.add_sheet(k)
    
    # write title firstly
    JOBS[k]["xlsHandler"].write(0, 0, 'build id')
    JOBS[k]["xlsHandler"].write(0, 1, 'start time        ')
    JOBS[k]["xlsHandler"].write(0, 2, 'build duration')
    JOBS[k]["xlsHandler"].write(0, 3, 'build result') 

    #retrieve all builds info from jenkins
    jobInfo = jenkinsServer.get_job_all_builds(JOBS[k]["name"]) 

    #write retrieved info into excel
    curExcelRow = 1
    buildArray = jobInfo["allBuilds"]
    lenBuildArray = len(buildArray)
    
    for buildIndex in range(lenBuildArray):
      # save id
      JOBS[k]["xlsHandler"].write(curExcelRow,0,buildArray[lenBuildArray-buildIndex-1]["id"])
      # save timestamp
      stamp = buildArray[lenBuildArray-buildIndex-1]["timestamp"]
      #print stamp
      stamp = time.strftime("%c", time.localtime(float(stamp)/1000))
      JOBS[k]["xlsHandler"].write(curExcelRow,1,stamp)
      # save duration, duration unit is ms
      dur = buildArray[lenBuildArray-buildIndex-1]["duration"]
      x = dur / 1000
      seconds = x % 60
      x /= 60
      minutes = x % 60
      x /= 60
      hours = x % 24
      dur = "%d:%d:%d"%(hours,minutes,seconds)
      JOBS[k]["xlsHandler"].write(curExcelRow,2,dur)
      #save result
      JOBS[k]["xlsHandler"].write(curExcelRow,3,buildArray[lenBuildArray-buildIndex-1]["result"])            
      curExcelRow = curExcelRow+1
    #pprint.pprint(jobInfo);
  
  # save the retrieved all builds info into excel ram, will save at the last
  #writeJobIntoXls()
  
  wb.save('jenkins.xls')