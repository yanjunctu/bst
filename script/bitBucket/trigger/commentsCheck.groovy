import org.apache.commons.httpclient.*
import org.apache.commons.httpclient.auth.*
import org.apache.commons.httpclient.methods.*
import groovyx.net.http.HTTPBuilder
import static groovyx.net.http.ContentType.*
import static groovyx.net.http.Method.*
import java.text.SimpleDateFormat;
import java.util.Date;
import hudson.model.*


@Grab(group='commons-httpclient', module='commons-httpclient', version='3.1')
@Grab('org.codehaus.groovy.modules.http-builder:http-builder:0.7.2' )


class commentsChecker{
    public void main(){
        String proj =System.getenv("projectKey")
        String repo = System.getenv("repoName")
        Integer PRId = Integer.parseInt(System.getenv("pullRequestId"))
        String toCommit =System.getenv("toCommit")
        String fromCommit = System.getenv("fromCommit")
        String localRepo = System.getenv("localRepo")
        String boosterRepo = System.getenv("boosterRepo")
        
        def commentsCountCmd = "${boosterRepo}/script/bitBucket/utilities/sourceCheck.bat ${localRepo} ${fromCommit} ${toCommit} ${proj} ${PRId} ${repo}"
        
        println "${commentsCountCmd}"
        
        def pocCC = commentsCountCmd.execute()
        pocCC.waitFor()
        println "${pocCC.text}"
        
    }
}

new commentsChecker().main()
