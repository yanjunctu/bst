import org.apache.commons.httpclient.*
import org.apache.commons.httpclient.auth.*
import org.apache.commons.httpclient.methods.*
import groovyx.net.http.HTTPBuilder
import static groovyx.net.http.ContentType.*
import static groovyx.net.http.Method.*
import java.text.SimpleDateFormat;
import java.util.Date;
import groovy.util.XmlParser
import hudson.model.*


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

    Object getPRpartici(String proj, String repo,Integer PRId){

        String userPassBase64 = "$stashPassword:$statshUserName".toString().bytes.encodeBase64()
        def http = new HTTPBuilder( m_site );
        http.ignoreSSLIssues()
        def ps = '/rest/api/1.0/projects/'+proj+'/repos/'+repo+'/pull-requests/'+PRId+'/participants';

        http.get( path: ps,
                  headers: ["Authorization": "Basic $userPassBase64"],
                  query: [limit:100] ) { resp, json ->
            return json;

        }

    }
    
    
    Object getPRChanges(String proj, String repo,Integer PRId){

        String userPassBase64 = "$stashPassword:$statshUserName".toString().bytes.encodeBase64()
        def http = new HTTPBuilder( m_site );
        http.ignoreSSLIssues()
        def ps = '/rest/api/1.0/projects/'+proj+'/repos/'+repo+'/pull-requests/'+PRId+'/changes';
        http.get( path: ps,
                  headers: ["Authorization": "Basic $userPassBase64"],
                  query: [limit:100] ) { resp, json ->
            return json;

        }

    }
    
    boolean postParticipants(String proj, String repo,Integer PRId,String userName,String role){

        String path = '/rest/api/1.0/projects/'+proj+'/repos/'+repo+'/pull-requests/'+PRId+'/participants';
        String userPassBase64 = "$stashPassword:$statshUserName".toString().bytes.encodeBase64()
        Object postBody = ["user":["name":userName],"role":role]
    

        def http = new HTTPBuilder( m_site );
        http.ignoreSSLIssues()

        http.request(POST,JSON,) { req ->
            headers = ["Authorization": "Basic $userPassBase64"]

            uri.path = path

            body = postBody

            response.success = {resp, json ->
                println "JSON POST Participants Success: ${resp.statusLine}"
                return true
            }

            response.failure = {resp ->
                println "JSON POST Participants Failed: ${resp.statusLine}"
                return false
            }
        }

    }


}

class componentOwnerManager{

    Map m_ownerMap=[:];

    componentOwnerManager(String mapFile){
         //*****get the reviwer in  the map***
        m_ownerMap.clear()
        def xmlRoot = new XmlParser().parse(mapFile)
   
        xmlRoot.component.each{
            def cp = it.attribute("name").replace("\\","/").trim()
            
            //remove the / at the string start and end
            if(cp.startsWith("/")){
                cp.getAt(1..-1)
            }
            if(cp.endsWith("/")){
                cp.getAt(0..-2)  
            }
            def owner = it.attribute("owner").toLowerCase().split(",")
            m_ownerMap."${cp}"=owner
        }
    }
    
    List componentOwner(String path){
        
        def owner =[]
        
        if (path.endsWith(".mk") || path.endsWith("Makefile") || path.endsWith("makefile")){
            //make file owner barry and essen
            owner =['pnw867','a4741c']
        }
        else if(m_ownerMap.containsKey(path)){
            owner = m_ownerMap[path]
        }
        else{
            def sub = path.split("/")
            if(sub.size()!=1){
                def subPath = sub.getAt(0..-2).join("/")
                owner = componentOwner(subPath)
            }
        }
        return owner
    }
    
    List getChgCPowner(List changes){
        //*****go through the changes***
        def chgCPowner =[]
        changes.each{
            
            chgCPowner << componentOwner(it)
        }
        
        chgCPowner = chgCPowner.flatten()
        chgCPowner = chgCPowner.unique()
        if (chgCPowner == []){
            // if not matched owner in map add s.s.he,and micheal jin as reviewer
            chgCPowner =["qpcb36"]
        }
        return chgCPowner
    }
}


class reviewerChecker{
    public void main(){

        String STASH_PROJECT =System.getenv("projectKey")
        String STASH_REPO = System.getenv("repoName")
        Integer PRId = Integer.parseInt(System.getenv("pullRequestId"))
        String boosterRepo = System.getenv("boosterRepo")
        //Integer PRId = 45
    
       /*******
       *get all the reviewer in the PR
       ********/
        def bitbucketHandle = new BitbucketREST()
        def allPartici = bitbucketHandle.getPRpartici(STASH_PROJECT,STASH_REPO,PRId)

        def Reviewers = []

        allPartici.values.each{
            if(it.role == "REVIEWER"){
                Reviewers << it.user.name.toLowerCase()
            }
        }
        
       /*******
       *get all the changed files
       ********/
        def allChanges = bitbucketHandle.getPRChanges(STASH_PROJECT,STASH_REPO,PRId)
        def changes=[]
        allChanges.values.each{
            changes << it.path.toString
        }
        
       /*******
       *compare to map file ,get the missed reviwer
       ********/

        //def mapfile = "C:/Users/QPCB36/Desktop/JIRA/utilities/componentOwner.xml";
        def mapfile = "${boosterRepo}/script/bitBucket/utilities/componentOwner.xml"
        def cpManager = new componentOwnerManager(mapfile)
        def chgCPowner = cpManager.getChgCPowner(changes)
        
        println chgCPowner
        if (chgCPowner.size()!=0){
            def missedReviwer = chgCPowner - Reviewers
            println "missed reviewer: ${missedReviwer}"
            def role = "REVIEWER"
            // add the missed reviewer to PR
            if(missedReviwer.size() > 0){
                missedReviwer.each{
                   bitbucketHandle.postParticipants(STASH_PROJECT,STASH_REPO,PRId,it,role) 
                } 
            }
        }
    }
}

new reviewerChecker().main()

