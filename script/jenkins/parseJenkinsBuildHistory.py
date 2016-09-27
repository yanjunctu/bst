#Below is dependency python lib needed by this script
#sudo pip install python-jenkins
#sudo pip install ssl
#sudo pip install pymongo

from jenkins import Jenkins
from jenkins import JenkinsException, TimeoutException
from pymongo import MongoClient
import ssl
import subprocess
import re
import gridfs

JENKINS_URL = 'https://cars.ap.mot-solutions.com:8080'
JENKINS_USERNAME = 'jhv384'
JENKINS_TOKEN = '4aff12c2c2c0fba8342186ef0fd9e60c'

JENKINS_WIN32_URL = 'http://jfrc74-02.ds.mot.com:8080'
#JENKINS_WIN32_URL = 'http://10.193.227.141:8080'
JENKINS_WIN32_USERNAME = 'admin'
JENKINS_WIN32_TOKEN = '0f15c71a49f4382912e81805fd27197f'

JENKINS_TIMEOUT = 60  # 60s
JENKINS_TRIGGER_JOBS = ['PCR-REPT-0-MultiJob','PCR-REPT-0-MultiJob-MCL','PCR-REPT-0-MultiJob-Emerald', 'PCR-REPT-0-MultiJob-nonEmerald', 'PCR-REPT-DAT_LATEST', 'PCR-REPT-DAT_DAILY','PCR-REPT-Memory_Leak_MultiJob-DAILY',"PCR-REPT-Git-KW"]
JENKINS_COVERAGE_JOB = 'PCR-REPT-Win32_COV_CHECK'
JENKINS_WIN32_UT = 'PCR-REPT-Win32_UT'
JENKINS_WIN32_IT_DIST = 'PCR-REPT-Win32_IT-TEST-Dist'
JENKINS_WIN32_IT_PART1 = 'PCR-REPT-Win32_IT-TEST-Part1'
JENKINS_WIN32_IT_PART2 = 'PCR-REPT-Win32_IT-TEST-Part2'
JENKINS_WIN32_TEST_JOBS = [JENKINS_WIN32_UT, JENKINS_WIN32_IT_DIST, JENKINS_WIN32_IT_PART1, JENKINS_WIN32_IT_PART2]
JENKINS_DAT_JOBS = ['PCR-REPT-DAT_LATEST', 'PCR-REPT-DAT_DAILY']
BOOSTER_DB_NAME = 'booster'

class BoosterJenkins():
    def __init__(self, url, username=None, password=None, timeout=None):
        self.url = url
        self.username = username
        self.password = password
        self.timeout = timeout
        self.server = Jenkins(url, username, password, timeout)
        
    def getJobInfo(self, name):
        jobInfo = self.server.get_job_info(name)

        jobInfo['subJobs'] = []
        if 'lastSuccessfulBuild' in jobInfo:
            info = jobInfo['lastSuccessfulBuild']

            if info and 'subBuilds' in info:
                for build in info['subBuilds']:
                    jobInfo['subJobs'].append(build['jobName'])
        else: 
            for subJob in jobInfo['downstreamProjects']:
                jobInfo['subJobs'].append(subJob['name'])
                
        return jobInfo

    def getBuildInfo(self, job, buildNum):
        return self.server.get_build_info(job, buildNum)

    def getConsoleOutput(self, job, buildNum):
        url = self.url + '/job/' + job + '/' + str(buildNum) + '/consoleText'
        cmd ='wget --no-check-certificate --auth-no-challenge --http-user={} --http-password={} {} -q -O -'.format(self.username, self.password, url)
        output = ""

        try:
            return subprocess.check_output(cmd.split(), stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError, e:
            raise JenkinsException('Failed to get console output, url: {}, job: {}, number: {}, err: {}'.format(self.url, job, buildNum, str(e)))


class BoosterDB():
    def __init__(self, dbClient, dbName):
        self.dbClient = dbClient
        self.db = dbClient[dbName]
        self.fs = gridfs.GridFS(self.db)

    def insertOne(self, collName, data):
        (self.db)[collName].insert_one(data)

        return True
    def findInfo(self, collName,*query):
        if collName not in self.db.collection_names() or 0 == (self.db)[collName].count:
            return None
        if len(query) == 1:
            docs=(self.db)[collName].find(query[0])
        elif len(query) ==2:
            docs=(self.db)[collName].find(query[0],sort=[query[1]])
        return [doc for doc in docs]
    
    def getLastBuildInfo(self, collName,key="number"):
        if collName not in self.db.collection_names() or 0 == (self.db)[collName].count:
            return None

        return (self.db)[collName].find_one(sort=[(key, -1)])

    def writeBlock(self, blockData, collection=None): 
        fs = gridfs.GridFS(self.db, collection) if collection else self.fs

        return fs.put(blockData)


def saveAllCI2DB(server,Win32server,db):
    i = 0
    allJobs = JENKINS_TRIGGER_JOBS
    jobSet = set(JENKINS_TRIGGER_JOBS)
   
    # Get all the info of trigger jobs and their downstream jobs
    while i < len(allJobs):
        cnt = 0
        job = allJobs[i]
        jobColl = 'CI-' + job

        print 'Process job {}'.format(job)
        try:
            jobInfo = server.getJobInfo(job)
        except TimeoutException as e:
            # If jenkins server hangs, return immediately
            print '\tGet job info for job {} timeout: {}'.format(job, str(e))
            return
        except JenkinsException as e:
            print '\tFailed to get job info for job {}: {}'.format(job, str(e))
            i += 1
            continue
       
        # Find the new builds of the job and save them to DB
        lastBuildSaved = db.getLastBuildInfo(jobColl)
        firstBuildNum = jobInfo['firstBuild']['number'] if 'firstBuild' in jobInfo else 0
        lastBuildNum = jobInfo['lastCompletedBuild']['number'] if 'lastCompletedBuild' in jobInfo else 0
        start = (lastBuildSaved['number']+1) if lastBuildSaved else firstBuildNum
        end = lastBuildNum
        while start <= end:
            print '\tProcess build [{}, {}]'.format(job, start)

            try:
                buildInfo = server.getBuildInfo(job, start)
            except TimeoutException as e:
                # If jenkins server hangs, return immediately
                print '\tGet build info for build [{}, {}] timeout: {}'.format(start, job, str(e))
                return
            except JenkinsException as e:
                print '\tFailed to get build info [{}, {}]: {}'.format(start, job, str(e))
                start += 1
                continue
            
            # Values of some specific fields in the following jobs need to
            # be extracted from their console outputs if any
            try:
                if job == JENKINS_COVERAGE_JOB:
                    # Coverage
                    output = server.getConsoleOutput(job, start)
                    match = re.search(r'AutoMerge(.*)%', output)
                    if match:
                        info = match.group(0).split()
                        buildInfo['coverage'] = info[len(info)-1]
                elif job in JENKINS_WIN32_TEST_JOBS and buildInfo['result'] == 'SUCCESS': 
                    #win32 Test case number
                    matches = None
                    output = server.getConsoleOutput(job, start)

                    if job == JENKINS_WIN32_UT:
                        index = output.find('Unit Test Result:')
                        if index == -1:
                            index = output.find(r'WIN32 UT Success, please check at:')
                            if index == -1:
                                print '\tCan not find UT result'
                            else:
                                #get the win32 UT console url
                                #WIN32 UT Success, please check at: http://jfrc74-02:8080/job/WIN32_IT/302/console
                                m = re.match(r"WIN32 UT Success, please check at: (?P<jenkins>.+)/job/(?P<jobname>.+)/(?P<buildNum>\d+)/",output[index:])
                                utJob = m.group("jobname")
                                utBuildNumber = int(m.group("buildNum"))
                                output = Win32server.getConsoleOutput(utJob, utBuildNumber)
                                matches = re.findall(r'\w+\s+OK \((\d+) tests,', output)
                        else:
                            # the old condition 
                            matches = re.findall(r'\w+\s+OK \((\d+) tests,', output[index:])
                    else:
                        index = output.find('WIN32 IT Success, please check at:')
                        if index == -1:
                            matches = re.findall(r'Done!! Totally (\d+) win32 cases run', output)
                        else:
                            #the new condition win32 pipline get the win32 IT console url
                            #WIN32 IT Success, please check at: http://jfrc74-02:8080/job/WIN32_IT/302/console
                            m = re.match(r"WIN32 IT Success, please check at: (?P<jenkins>.+)/job/(?P<jobname>.+)/(?P<buildNum>\d+)/",output[index:])
                            itJob = m.group("jobname")
                            itBuildNumber = int(m.group("buildNum"))
                            output = Win32server.getConsoleOutput(itJob, itBuildNumber)
                            matches = re.findall(r'^\d{4}-\d{2}-\d{2}.+Done!! Totally (\d+) win32 cases run', output,re.M)
       
                    if matches:
                        buildInfo['testcaseNum'] = 0
                        for num in matches:
                            buildInfo['testcaseNum'] += int(num)
                # We want to get the actual EXIT CODE from IDAT exe and store it in DB
                elif job in JENKINS_DAT_JOBS:
                    # Exit code of DAT
                    buildInfo['IDAT_EXIT_CODES'] = []
                    output = server.getConsoleOutput(job, start)
                    matches = re.findall(r'IDATAutoTestTrigger Exit: \d+', output)

                    if matches:
                        for match in matches:
                            match = match.split(':')[1].strip()
                            buildInfo['IDAT_EXIT_CODES'].append(match)
            except JenkinsException as e:
                pass

            # Save its log if the build failed by itself not its sub-builds
            if (buildInfo['result'] != 'SUCCESS'
                and ('subBuilds' not in buildInfo or not buildInfo['subBuilds'])):
                try:
                    buildLog = server.getConsoleOutput(job, buildInfo['number'])
                    buildInfo['buildLogID'] = db.writeBlock(buildLog)
                except JenkinsException as e:
                    pass

            db.insertOne(jobColl, buildInfo)
            cnt += 1

            start += 1

        print '\tDone, {} new records are inserted into DB.'.format(cnt)
        # A CI consists of multiple jobs, so append each related sub-job to job array to get its info
        for subJob in jobInfo['subJobs']:
            if subJob not in jobSet:
                jobSet.add(subJob)
                allJobs.append(subJob)
        
        i += 1


if __name__ == "__main__":
    try:
        ssl._create_default_https_context = ssl._create_unverified_context
    except AttributeError:
        pass

    server = BoosterJenkins(JENKINS_URL, JENKINS_USERNAME, JENKINS_TOKEN, JENKINS_TIMEOUT)
    dbClient = MongoClient()
    db = BoosterDB(dbClient, BOOSTER_DB_NAME)
    
    Win32server = BoosterJenkins(JENKINS_WIN32_URL, JENKINS_WIN32_USERNAME, JENKINS_WIN32_TOKEN, JENKINS_TIMEOUT)

    saveAllCI2DB(server,Win32server,db)

