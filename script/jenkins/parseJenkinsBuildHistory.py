#Below is dependency python lib needed by this script
#sudo pip install python-jenkins
#sudo pip install ssl
#sudo pip install pymongo

from jenkins import Jenkins
from jenkins import JenkinsException
from pymongo import MongoClient
import ssl
import subprocess
import re
import sys
import gridfs

JENKINS_URL = 'https://cars.ap.mot-solutions.com:8080'
JENKINS_USERNAME = 'jhv384'
JENKINS_TOKEN = '4aff12c2c2c0fba8342186ef0fd9e60c'
JENKINS_TRIGGER_JOBS = ['PCR-REPT-0-MultiJob', 'PCR-REPT-0-MultiJob-Emerald', 'PCR-REPT-0-MultiJob-nonEmerald', 'PCR-REPT-DAT_LATEST', 'PCR-REPT-DAT_DAILY','PCR-REPT-Memory_Leak_MultiJob-DAILY']
JENKINS_COVERAGE_JOB = 'PCR-REPT-Win32_COV_CHECK'
# PCR-REPT-0-MultiJob is the trigger job of a CI request, the other two jobs are here for the purpose of compatibility
JENKINS_PCR_REPT_JOBS = ['PCR-REPT-0-MultiJob', 'PCR-REPT-0-MultiJob-Emerald', 'PCR-REPT-0-MultiJob-nonEmerald']
JENKINS_GIT_RELEASE_JOB = 'PCR-REPT-Git-Release'
BOOSTER_DB_NAME = 'booster'
CI_HISTORY_COLLECTION = 'CIHistoryInfo'
CI_BUILD_LOG_COLLECTION = 'CIBuildLog'

class BoosterJenkins():
    def __init__(self, url, username=None, password=None):
        self.url = url
        self.username = username
        self.password = password
        self.server = Jenkins(url, username, password)
        
    def getJobInfo(self, name):
        try:
            jobInfo = self.server.get_job_info(name)
        except JenkinsException, je:
            print 'Failed to get job info for job {}: {}'.format(name, str(je))
            return None 

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
        try:
            buildInfo = self.server.get_build_info(job, buildNum)
        except JenkinsException, je:
            print 'Failed to get build info[{}, {}]: {}'.format(job, buildNum, str(je))
            return None

        return buildInfo 

    def getConsoleOutput(self, job, buildNum):
        url = self.url + '/job/' + job + '/' + str(buildNum) + '/consoleText'
        cmd ='wget --no-check-certificate --auth-no-challenge --http-user={} --http-password={} {} -q -O -'.format(self.username, self.password, url)
        output = ""
        
        try:
            output = subprocess.check_output(cmd.split(), stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError, e:
            print 'Failed to get console output, url: {}, job: {}, number: {}, err: {}'.format(self.url, job, buildNum, str(e))

            return None

        return output


class BoosterDB():
    def __init__(self, dbClient, dbName):
        self.dbClient = dbClient
        self.db = dbClient[dbName]
        self.fs = gridfs.GridFS(self.db)

    def insertOne(self, jobName, data):
        (self.db)[jobName].insert_one(data)

        return True

    def getLastBuildInfo(self, jobName):
        if jobName not in self.db.collection_names() or 0 == (self.db)[jobName].count:
            return None

        return (self.db)[jobName].find_one(sort=[('number', -1)])

    def writeBlock(self, blockData, collection=None): 
        fs = gridfs.GridFS(self.db, collection) if collection else self.fs

        return fs.put(blockData)


def saveAllCI2DB(server, db):
    i = 0
    allJobs = JENKINS_TRIGGER_JOBS
    jobSet = set(JENKINS_TRIGGER_JOBS)
   
    # Get all the info of tirgger jobs and their downstream jobs
    while i < len(allJobs):
        cnt = 0
        job = allJobs[i]
        jobInfo = server.getJobInfo(job)
       
        print 'Process job {}'.format(job)
        if not jobInfo:
            i += 1
            print '\tDone, 0 new records are inserted into DB.'
            continue
        # Find the new builds of the job and save them to DB
        lastBuildSaved = db.getLastBuildInfo(job)
        firstBuildNum = jobInfo['firstBuild']['number'] if 'firstBuild' in jobInfo else 0
        lastBuildNum = jobInfo['lastCompletedBuild']['number'] if 'lastCompletedBuild' in jobInfo else 0
        start = (lastBuildSaved['number']+1) if lastBuildSaved else firstBuildNum
        end = lastBuildNum
        while start <= end:
            buildInfo = server.getBuildInfo(job, start)
            
            print '\tProcess build [{}, {}]'.format(job, start)
            if buildInfo:
                # We want to know the coverage value
                if job == JENKINS_COVERAGE_JOB:
                    output = server.getConsoleOutput(job, start)
                    if output:
                        match = re.search(r'AutoMerge(.*)%', output)
                        if match:
                            info = match.group(0).split()
                            buildInfo['coverage'] = info[len(info)-1]
                # Save its log if the build failed by the build itself not its sub-builds
                if buildInfo['result'] != 'SUCCESS' and 'subBuilds' not in buildInfo:
                    buildLog = server.getConsoleOutput(job, buildInfo['number'])
                    if buildLog:
                        buildInfo['buildLogID'] = db.writeBlock(buildLog)

                db.insertOne(job, buildInfo)
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

    server = BoosterJenkins(JENKINS_URL, JENKINS_USERNAME, JENKINS_TOKEN)
    dbClient = MongoClient()
    db = BoosterDB(dbClient, BOOSTER_DB_NAME)

    saveAllCI2DB(server, db)

    # variables with subffix "2" are used to replace their old version, but there is more
    # other work to do. For example, code for reading db should be modified. Delete them all
    # when the other work is done.
    # server2 = BoosterJenkins2(JENKINS_URL, JENKINS_USERNAME, JENKINS_TOKEN)
    # db2 = BoosterDB2(BOOSTER_DB_NAME)

    # saveAllCI2DB2(server2, db2)

