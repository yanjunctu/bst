import org.apache.commons.httpclient.*
import org.apache.commons.httpclient.auth.*
import org.apache.commons.httpclient.methods.*
import groovyx.net.http.HTTPBuilder
import static groovyx.net.http.ContentType.*
import static groovyx.net.http.Method.*
import java.text.SimpleDateFormat;
import java.util.Date;

@Grab(group='commons-httpclient', module='commons-httpclient', version='3.1')
@Grab('org.codehaus.groovy.modules.http-builder:http-builder:0.7.2' )



class BitbucketREST{
    static String stashPassword ="amb4116"
    static String statshUserName = "configQ2@"
    String m_site="";

    /*
     * constructor function, to set Bitbucket hostname
     */
    BitbucketREST(){
        m_site = "https://bitbucket.mot-solutions.com";
    }

    /*
     * fetch all PRs info from proj:repo, and return with json object
     */
    Object getAllPR(String proj, String repo){

        String userPassBase64 = "$stashPassword:$statshUserName".toString().bytes.encodeBase64()
        def http = new HTTPBuilder( m_site );
        http.ignoreSSLIssues()
        def ps = '/rest/api/1.0/projects/'+proj+'/repos/'+repo+'/pull-requests';
        http.get( path: ps,
                headers: ["Authorization": "Basic $userPassBase64"],
                query: [limit:500] ) { resp, json ->

            return json;

        }

    }

    /*
     * add a comments to a pointed proj/repo/PRId
     */
    boolean postComment(String proj, String repo,Integer PRId,String text){

        String path = '/rest/api/1.0/projects/'+proj+'/repos/'+repo+'/pull-requests/'+PRId+'/comments';
        String userPassBase64 = "$stashPassword:$statshUserName".toString().bytes.encodeBase64()
        def http = new HTTPBuilder( m_site );
        http.ignoreSSLIssues()

        http.request(POST,JSON,) { req ->
            headers = ["Authorization": "Basic $userPassBase64"]

            uri.path = path

            body = [text: text]

            response.success = {resp, json ->
                println "JSON POST Comments Success: ${resp.statusLine}"
                return true
            }

            response.failure = {resp ->
                println "JSON POST Comments Failed: ${resp.statusLine}"
                return false
            }
        }

    }

}

class PRClass{

    static String TARGET_BRANCH_OFFRAMP = 'offramp_R2.7.0'
    static String TARGET_BRANCH_MAIN = 'main'
    Object m_jsonObject




    PRClass(def jsonObject){
        m_jsonObject = jsonObject
    }

    boolean qualifyCI(){

        boolean qualifyResult = true

        if ((m_jsonObject.toRef.displayId != TARGET_BRANCH_OFFRAMP) &&
                (m_jsonObject.toRef.displayId != TARGET_BRANCH_MAIN) ){
            println("qualify failed!! As target branch is ${m_jsonObject.toRef.displayId} should be ${TARGET_BRANCH_OFFRAMP} or ${TARGET_BRANCH_MAIN}")
            qualifyResult = false;
            return false
        }else{
            def jobName

            if(m_jsonObject.toRef.displayId == TARGET_BRANCH_OFFRAMP){
                jobName = 'PCR-REPT-0-MultiJob'
            }else{
                jobName = 'PCR-REPT-0-MultiJob-MCL'
            }
            // check if CI is blocking, if so, return directly
            if(!new JenkinsManager().isCIAlive(jobName)){
                println("CI is blocking")
                return false
            }
        }


        println("") //draw a blank line
        println("PR name = ${m_jsonObject.title}; id = ${m_jsonObject.id}")
        println("PR author = ${m_jsonObject.author.user.displayName}")
        println("PR branch = ${m_jsonObject.fromRef.displayId}")
        println("PR commitId = ${m_jsonObject.fromRef.latestCommit}")
        // check if author chooser one reviewer at least
        if (m_jsonObject.reviewers.size() == 0){
            qualifyResult = false
            println("qualify failed!! As reviwer number is 0")
        }
        if (qualifyResult){
            // check each review status
            m_jsonObject.reviewers.each{review->
                if(!review.approved){
                    println("qualify failed!! As reviwer: ${review.user.name} not approve")
                    qualifyResult = false
                    // I don't how to exit the each loop currently so not now
                }
            }
        }


        return qualifyResult









    }
}

class JenkinsManager{

    String m_site="";
    static String JENKINS_USER = "pnw748";
    static String JENKINS_TOKEN = "079ffabb999ca608c05753b7557f442f";
    static String beTriggerJobToken = "Trigger_Token";
    static String TARGET_BRANCH_OFFRAMP = 'offramp_R2.7.0'
    static String TARGET_BRANCH_MAIN = 'main'
    static String TRIGGER_JOB_NAME_OFFRAMP = "PCR-REPT-0-Git-Triger";
    static String TRIGGER_JOB_NAME_MAIN = "PCR-REPT-0-Git-Triger-MCL";
    /*
     * constructor function, to set Bitbucket hostname
     */
    JenkinsManager(){
        m_site = "https://cars.ap.mot-solutions.com:8080";
    }

    /*
     * trigger jobs in CARS system to do actually CI
     */
    boolean triggerRemoteJob(PRClass pr){

        def prJsonObj = pr.m_jsonObject

        def triggerJobName

        if(prJsonObj.toRef.displayId == TARGET_BRANCH_OFFRAMP){
            triggerJobName = TRIGGER_JOB_NAME_OFFRAMP
        }else{
            triggerJobName = TRIGGER_JOB_NAME_MAIN
        }

        String path = '/job/'+triggerJobName+'/buildWithParameters'

        String userPassBase64 = "$JENKINS_USER:$JENKINS_TOKEN".toString().bytes.encodeBase64()
        def http = new HTTPBuilder( m_site );
        http.ignoreSSLIssues()

        // define parameters passed to fushanghai
        def postBody = [token: beTriggerJobToken,
                        EMAIL: prJsonObj.author.user.emailAddress,
                        SUBMITTER:prJsonObj.author.user.displayName,
                        IR_BRANCH:prJsonObj.fromRef.displayId,
                        PUSH_TIME:System.currentTimeMillis(),
                        GIT_COMMIT:prJsonObj.fromRef.latestCommit]
        println(path)
        http.post( path: path,
                headers: ["Authorization": "Basic $userPassBase64"],
                body: postBody ) { resp ->

            //println "POST Success: ${resp.statusLine.statusCode}"
            println "POST resp: ${resp}"
            return (resp.statusLine.statusCode == 201)?true:false;
        }
    }

    boolean isCIAlive(MultJobName){

        String userPassBase64 = "$JENKINS_USER:$JENKINS_TOKEN".toString().bytes.encodeBase64()
        def http = new HTTPBuilder( m_site );
        http.ignoreSSLIssues()
        def ps = '/job/'+MultJobName+'/api/json';
        http.get( path: ps,
                headers: ["Authorization": "Basic $userPassBase64"],
                query: [:] ) { resp, json ->

            return json.buildable

        }

    }
}


class Poll{
    public void main(){

        String STASH_PROJECT ="MOTOTRBO_INFRA_FW"
        String STASH_REPO = "Comm"
        def triggerSuccessCnt=0;
        def jenkins = new JenkinsManager()


        def bitbucketHandle = new BitbucketREST()
        def allPRs = bitbucketHandle.getAllPR(STASH_PROJECT,STASH_REPO)

        // report warning if not only one page
        if(allPRs.isLastPage == false){
            println("current can only handle one page!")
            System.exit(1)
        }

        def PRs = []
        // go through all PRs
        allPRs.values.each{
            PRs << new PRClass(it)//construct a PR object with it, and append to PRs array
        }
        PRs = PRs.reverse() // reverse it as want to deal with oldest PRs firstly
        String TriggerCI_FILE_PATH = ".\\triggeredCIRecords.txt"

        File prevPRFileHandler = new File(TriggerCI_FILE_PATH)
        if(!prevPRFileHandler.exists()){
            prevPRFileHandler.createNewFile()
        }

        PRs.each{PR->
            def result = PR.qualifyCI()//check if this PR meet the rule to trigger a CI
            if(result){
                // meet CI rules, check if this CI have triggered or not before trigger
                def j = PR.m_jsonObject;
                String identifier = "from "+j.fromRef.latestCommit+" to "+j.toRef.displayId
                if (!prevPRFileHandler.text.contains(identifier)){
                    boolean success = jenkins.triggerRemoteJob(PR) // trigger a remote jenkins job to start running CI
                    if(success == true){
                        println('trigger successed!')
                        triggerSuccessCnt = triggerSuccessCnt+1;
                        prevPRFileHandler << (identifier+System.lineSeparator())
                        long yourmilliseconds = System.currentTimeMillis();
                        SimpleDateFormat sdf = new SimpleDateFormat("MMM dd,yyyy HH:mm");
                        Date resultdate = new Date(yourmilliseconds);
                        // add a comment to the PR to tell author that his PR is submitted CI
                        String definedCIPostStr =
"""
Below information is added by Booster team:
Automatically submitted CI as every reviewer approved your PR!
Trigger_Time:${sdf.format(resultdate)}
Submitter :${j.author.user.displayName}
Branch:${j.fromRef.displayId}
Commit ID:${j.fromRef.latestCommit}
"""
                        bitbucketHandle.postComment(STASH_PROJECT,STASH_REPO,j.id,definedCIPostStr)
        }
                }else{
                    println('this PR already triggered!')
                }
            }
        }

        println System.lineSeparator()+System.lineSeparator()+"Triggered PR Cnt :${triggerSuccessCnt}"
    }
}

new Poll().main()
