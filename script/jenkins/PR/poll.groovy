import org.apache.commons.httpclient.*
import org.apache.commons.httpclient.auth.*
import org.apache.commons.httpclient.methods.*
import groovyx.net.http.HTTPBuilder

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
        def ps = '/rest/api/1.0/projects/'+proj+'/repos/'+repo+'/pull-requests/';
        http.get( path: ps,
                  headers: ["Authorization": "Basic $userPassBase64"],
                  query: [:] ) { resp, json ->

            return json;

        }

    }

}

class PRClass{
    Object m_jsonObject

    PRClass(def jsonObject){
        m_jsonObject = jsonObject
    }

    boolean qualifyCI(){

        boolean qualifyResult = true
        println(m_jsonObject.id)
        // check each review status
        m_jsonObject.reviewers.each{review->
            println(review.user.name)
            if(!review.approved){
                qualifyResult = false
                // I don't how to exit the each loop currently so not now
            }
        }

        /*
         * Any target branch is REPT_2.7_INT apply CI
         */
        if (qualifyResult){
            if (m_jsonObject.toRef.displayId != 'REPT_2.7_INT'){
                qualifyResult = false;
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
    static String JobName = "PCR-REPT-0-Git-Triger-MCL";
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

        String path = '/job/'+JobName+'/buildWithParameters'

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

        http.post( path: path,
                headers: ["Authorization": "Basic $userPassBase64"],
                body: postBody ) { resp ->

            println "POST Success: ${resp.statusLine.statusCode}"

            return (resp.statusLine.statusCode == 201)?true:false;
        }
    }
}


class Poll{
    public void main(){

        String STASH_PROJECT ="MOTOTRBO_INFRA_FW"
        String STASH_REPO = "Comm"

        def allPRs = new BitbucketREST().getAllPR(STASH_PROJECT,STASH_REPO)

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
                    boolean success = new JenkinsManager().triggerRemoteJob(PR) // trigger a remote jenkins job to start running CI
                    println success;
                    if(success == true){
                        println('trigger successed!')
                        prevPRFileHandler.append(identifier+"\n")
                    }
                }else{
                    println('this PR already triggered!')
                }
            }
        }

    }
}

new Poll().main()
