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

JENKINS_URL = 'https://cars.ap.mot-solutions.com:8080'
JENKINS_USERNAME = 'jhv384'
JENKINS_TOKEN = '4aff12c2c2c0fba8342186ef0fd9e60c'
JENKINS_TRIGGER_JOBS = ['PCR-REPT-0-MultiJob', 'PCR-REPT-0-MultiJob-Emerald', 'PCR-REPT-0-MultiJob-nonEmerald', 'PCR-REPT-DAT_LATEST', 'PCR-REPT-DAT_DAILY','PCR-REPT-Memory_Leak_MultiJob-DAILY']
JENKINS_COVERAGE_JOB = 'PCR-REPT-Win32_COV_CHECK'
BOOSTER_DB_NAME = 'booster'

class BoosterJenkins():
    def __init__(self, url, username=None, password=None):
        self.url = url
        self.username = username
        self.password = password
        self.server = Jenkins(url, username, password)
        
    def getJobInfo(self, name):
        ret = {}

        try:
            jobInfo = self.server.get_job_info(name)
        except JenkinsException, je:
            print 'Failed to get job info for job {}: {}'.format(name, str(je))
            return None 

        ret['name'] = name
        ret['firstBuild'] = jobInfo['firstBuild']['number'] if 'firstBuild' in jobInfo else 0
        ret['lastBuild'] = jobInfo['lastCompletedBuild']['number'] if 'lastCompletedBuild' in jobInfo else 0
        ret['subJobs'] = []
        if 'lastSuccessfulBuild' in jobInfo:
            info = jobInfo['lastSuccessfulBuild']

            if info and 'subBuilds' in info:
                for build in info['subBuilds']:
                    ret['subJobs'].append(build['jobName'])
        else: 
            for subJob in jobInfo['downstreamProjects']:
                ret['subJobs'].append(subJob['name'])
                
        return ret 

    def getBuildInfo(self, job, buildNum):
        ret = {}

        try:
            buildInfo = self.server.get_build_info(job, buildNum)
        except JenkinsException, je:
            print 'Failed to get build info[{}, {}]: {}'.format(job, buildNum, str(je))
            return None

        ret['name'] = job 
        ret['build id'] = buildNum
        ret['build result'] = buildInfo['result']
        ret['start time'] = buildInfo['timestamp']
        ret['build duration'] = buildInfo['duration']
        ret['submitter'] = ''
        ret['push time'] = ''
        # Some parameters we are interested in
        for action in buildInfo['actions']:
            if 'parameters' in action:
                allParams = action['parameters']

                for obj in allParams:
                    if obj['name'] == 'SUBMITTER':
                        ret['submitter'] = obj['value']
                    elif obj['name'] == 'PUSH_TIME':
                        ret['push time'] = obj['value']
                    elif obj['name'] == 'PROJECT_NAME':
                        ret['project name'] = obj['value']
                    elif obj['name'] == 'NEW_BASELINE':
                        ret['release tag'] = obj['value']
        # Sub-builds info of current build
        if 'subBuilds' in buildInfo:
            for build in buildInfo['subBuilds']:
                ret[build['jobName']] = build['buildNumber']

        return ret

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
        self.db = dbClient[dbName]

    def insertOne(self, collection, data):
        (self.db)[collection].insert_one(data)

        return True

    def getLastBuildInfo(self, collection):
        if collection not in self.db.collection_names() or 0 == (self.db)[collection].count:
            return None

        return (self.db)[collection].find_one(sort=[('build id', -1)])


def saveAllCI2DB(server, db):
    i = 0
    allJobs = JENKINS_TRIGGER_JOBS
    jobSet = set(JENKINS_TRIGGER_JOBS)
   
    # Get all the info of tirgger jobs and their downstream jobs
    while i < len(allJobs):
        job = allJobs[i]
        jobInfo = server.getJobInfo(job)
       
        print 'process job {}'.format(job)
        if not jobInfo:
            i += 1
            continue
        # Find the new builds of the job and save them to DB
        lastBuildSaved = db.getLastBuildInfo(job)
        start = (lastBuildSaved['build id']+1) if lastBuildSaved else jobInfo['firstBuild']
        end = jobInfo['lastBuild']
        while start <= end:
            buildInfo = server.getBuildInfo(job, start)
            
            print '\tprocess build {}'.format(start)
            if buildInfo:
                # We want to know the coverage value
                if job == JENKINS_COVERAGE_JOB:
                    output = server.getConsoleOutput(job, start)
                    if output:
                        match = re.search(r'AutoMerge(.*)%', output)
                        if match:
                            info = match.group(0).split()
                            buildInfo['coverage'] = info[len(info)-1]
                db.insertOne(job, buildInfo)

            start += 1

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

