var express = require('express');
var router = express.Router();
var jenkins = require('../models/jenkins.js');
var email = require('../models/email.js');
var passWord = require('../models/password.js');
var jenkinsCIJob = require('../models/jenkinsJob.js');
var fiber = require('fibers');
var Server = require('mongo-sync').Server;
var cnt=0;
var GET_JENKINS_INTERVAL = 15000; // 15seconds
var CI_HISTORY_INTERVAL = 60000*20; // 20 minutes
var days=30;


var SIDELINE_PRJ = "REPT2.8"
var MAINLINE_PRJ = "REPT_MAIN"
var ALL_PRJ = [MAINLINE_PRJ,SIDELINE_PRJ]
var CISTATUS = {}

// Variables for CI history info
var CILastTriggerBuildID={}
var CIHistory = {};
ALL_PRJ.forEach(function(project){
    CISTATUS[project] = {
      "idleState":{"status":"running","duration":0},
      "preCheckState":{"status":"not start","duration":2},
      "buildFwState":{"status":"not start","duration":3},
      "testFwState":{"status":"not start","duration":4},
      "buildWin32State":{"status":"not start","duration":5},
      "testWin32State":{"status":"not start","duration":0},
      "preReleaseState":{"status":"not start","duration":0},
      "overall":{"current":{"subBranch":"na",subCommitId:"na","subTime":"na"}},
      "ciBlockInfo":{"result":"SUCCESS","submitter":"na","releaseTag":"na",lastSuccessTag:"na",manualControl:"FALSE"}
    };
    CILastTriggerBuildID[project] = 0;
    CIHistory[project] = [];
});
var CI_TRIGGER_JOB = {};
CI_TRIGGER_JOB[SIDELINE_PRJ] = "PCR-REPT-0-MultiJob";
CI_TRIGGER_JOB[MAINLINE_PRJ] = "PCR-REPT-0-MultiJob-MCL";
const CI_ON_TARGET_JOB = "PCR-REPT-On_Target_MultiJob";
const CI_ON_TAEGET_BUILD_JOB = "PCR-REPT-On_Target_Build_MultiJob";
const CI_OFF_TARGET_JOB = "PCR-REPT-Off_Target_MultiJob";
const CI_OFF_TARGET_BUILD_JOB = "PCR-REPT-Off_Target_Build_MultiJob";
const CI_OFF_TARGET_TEST_JOB = "PCR-REPT-Off_Target_Test_MultiJob";
const CI_OFF_TARGET_UT_JOB = "PCR-REPT-Win32_UT";
// This is not a real jenkins job, it is defined as a key to get IT build result
const CI_OFF_TARGET_IT_JOB = "PCR-REPT-Win32_IT";  
const CI_OFF_TARGET_IT_PART1_JOB = "PCR-REPT-Win32_IT-TEST-Part1";
const CI_OFF_TARGET_IT_PART2_JOB = "PCR-REPT-Win32_IT-TEST-Part2";
const CI_OFF_TARGET_IT_DIST_JOB = "PCR-REPT-Win32_IT-TEST-Dist";
const CI_COVERAGE_CHECK_JOB = "PCR-REPT-Win32_COV_CHECK";
const CI_RELEASE_JOB = "PCR-REPT-Git-Release";
const CI_PRECHECK_JOB = "PCR-REPT-Git-Integration";
const CI_SANITY_TEST_JOB = "PCR-REPT-DAT_LATEST";
const CI_EXT_REGRESSION_JOB = "PCR-REPT-DAT_DAILY";
const CI_MEMORY_LEAK_JOB = "PCR-REPT-Memory_Leak_MultiJob-DAILY";
const CI_WARNING_COLL_NAME = "warningKlocwork";
const CI_KLOCWORK_COLL_NAME = "klocwork";
var  CILastSanityBuildID = 0, CILastExtRegressionBuildID = 0,CIMemoryLeakBuildID=0;
var CILastKlocworkBuildID=0;
var keyMap = {};

// Associate job names with keys of CI history info
keyMap[CI_PRECHECK_JOB] = "precheck";
keyMap[CI_ON_TAEGET_BUILD_JOB] = "onTargetBuild";
keyMap[CI_OFF_TARGET_BUILD_JOB] = "offTargetBuild";
keyMap[CI_OFF_TARGET_UT_JOB] = "win32UT";
keyMap[CI_OFF_TARGET_IT_JOB] = "win32IT";
keyMap[CI_OFF_TARGET_IT_DIST_JOB] = "win32ITDist";
keyMap[CI_OFF_TARGET_IT_PART1_JOB] = "win32ITPart1";
keyMap[CI_OFF_TARGET_IT_PART2_JOB] = "win32ITPart2";


var getJobLastBuild = function(job,callback)
{
  var result;
  jenkins.last_build_info(job, function(err, data) {
    callback(err,data);
  });

};

var getJobBuild = function(job,build,callback)
{
  var result;
  jenkins.build_info(job, build,function(err, data) {
    callback(err,data);
  });  
};

function getParameterValue(data,parameter){

  var found="";
  if (data.hasOwnProperty("actions")){
      var actions = data.actions;
      actions.forEach(function(action){
        if (action.hasOwnProperty("parameters")) {
          var paras = action.parameters;
          paras.forEach(function(para){
            //console.log(para.name);
            if(para.name==parameter){
              //console.log("found",para.value)
              found = para.value;
              return found;
            }   
          })
        }
      });
  }
  return found;
}


function getPendingReq(project, callback){
    var result = {"current":{"submitter":"","subBranch":"","subCommitId":"","subTime":0},"queue":[]};

    try {
        jenkins.queue(function(err, data){
            if (err) {
                console.log(err);
                callback(err, result);
                return;
            }

            var items = data.items;
            //var prjName = "PROJECT_NAME=".concat(project);
            //var prjName = "PROJECT_NAME="+project+"&|$"
            items.forEach(function(item){
                //if ((item.blocked || item.stuck) && item.params.indexOf(prjName) > -1){
                if (item.blocked || item.stuck) {
                    var projName = '',submitter='',branch='',pushTime='',commitId='',submail='';
                    var paraArray = item.params.split('\n');
                    //console.log('array=',paraArray);
                    var id = item['id'];
                    paraArray.forEach(function(itr){
                        var keyValue = itr.split('=');
                        
                        if(keyValue[0] == 'PROJECT_NAME')
                        {
                            projName = keyValue[1];
                        }
                        if(keyValue[0] == 'SUBMITTER')
                        {
                            submitter = keyValue[1];
                        }
                        if(keyValue[0] == 'IR_BRANCH')
                        {
                            branch = keyValue[1];
                        }
                        if(keyValue[0] == 'GIT_COMMIT')
                        {
                            commitId = keyValue[1];
                        }
                        if(keyValue[0] == 'PUSH_TIME')
                        {
                            pushTime = keyValue[1];
                        }
                        if(keyValue[0] == 'EMAIL')
                        {
                            submail = keyValue[1];
                        }
                   
                    });
                    
                    if(projName == project){
                        var jobName = /pcr-rept-0-multijob/ig.exec(item.task.name);
                        if (jobName && submitter && branch && pushTime && commitId){
                     
                            console.log('jobname:'+item.task.name);
                                        console.log(submitter,branch,commitId,pushTime,submail);
                            result.queue.push({"id": id,"submitter":submitter,"subBranch":branch,"subCommitId":commitId,"subTime":pushTime,"submail":submail});
                        }     
                    }
                }
            });

            callback(null, result);
        });
    }catch(e){
        console.log("failed to call jenkins.queue");
        callback(null, result);
    }
}

var updateStatus = function(ciStatus,data){
    
    ciStatus.idleState.status="not start";
    ciStatus.preCheckState.status="not start";
    ciStatus.buildFwState.status="not start";
    ciStatus.testFwState.status="not start";
    ciStatus.buildWin32State.status="not start";
    ciStatus.testWin32State.status="not start";
    ciStatus.preReleaseState.status="not start";   
    ciStatus.overall.current.submitter="na";
    ciStatus.overall.current.subTime="na";
    ciStatus.overall.current.subBranch="na";
    ciStatus.overall.current.subCommitId="na";
    if (data.building==false){
      //return res.json(ciStatus);
      ciStatus.idleState.status="running";
    }else {
      ciStatus.idleState.status="done"; 
      ciStatus.overall.current.submitter= getParameterValue(data,"SUBMITTER");//data.actions[0].parameters[1].value;
      ciStatus.overall.current.subBranch= getParameterValue(data,"IR_BRANCH");//data.actions[0].parameters[1].value;      
      ciStatus.overall.current.subCommitId= getParameterValue(data,"GIT_COMMIT");//data.actions[0].parameters[1].value;
      ciStatus.overall.current.subTime = data.timestamp;

      data.subBuilds.forEach(function(element, index, array){
        if(element.jobName =='PCR-REPT-Git-Integration'){
          if (element.result==null){
            ciStatus.preCheckState.status = "running";
            //console.log("preCheckState running");
          }
          else if(element.result=="SUCCESS"){
            ciStatus.preCheckState.status = "done";
            //console.log("preCheckState done");            
          }
        } else if(element.jobName =='PCR-REPT-Git-Release'){
          if (element.result==null){
            ciStatus.preReleaseState.status = "running";
            console.log("preReleaseState running");            
          }
          else if(element.result=="SUCCESS"){
            ciStatus.preReleaseState.status = "done";
            //console.log("preReleaseState done");               
          }
        } else if(element.jobName =='PCR-REPT-On_Target_MultiJob'){
          if (element.result=="SUCCESS"){
            ciStatus.buildFwState.status = "done";
            ciStatus.testFwState.status = "done";            
            //console.log("On Target all done");               
          }
          else if(element.result==null){
              getJobBuild('PCR-REPT-On_Target_MultiJob',element.buildNumber,function(err,data){
              if(err) 
              {
                //console.log("err in subBuilds ON target ")
                return;
              }
              
              data.subBuilds.forEach(function(element, index, array){
                if(element.jobName =='PCR-REPT-On_Target_Build_MultiJob'){
                  if (element.result==null){
                    ciStatus.buildFwState.status = "running";
                    //console.log("buildFwState running");                       
                  }
                  else if(element.result=="SUCCESS"){
                    ciStatus.buildFwState.status = "done";
                    //console.log("buildFwState done");                      
                  }
                } else if(element.jobName =='PCR-REPT-On_Target_Test_MultiJob'){
                  if (element.result==null){
                    ciStatus.testFwState.status = "running";
                    //console.log("testFwState running");                      
                  }
                  else if(element.result=="SUCCESS"){
                    ciStatus.testFwState.status = "done";
                    //console.log("testFwState done");                         
                  }
                } 
              });
          });
          }
        } else if(element.jobName =='PCR-REPT-Off_Target_MultiJob'){
          if (element.result=="SUCCESS"){
            ciStatus.buildWin32State.status = "done";
            ciStatus.testWin32State.status = "done";   
            //console.log("Off target all done"); 
          }
          else if(element.result==null){
              getJobBuild('PCR-REPT-Off_Target_MultiJob',element.buildNumber,function(err,data){
              if(err) 
              {
                console.log("err in subBuilds OFF target ")
                return;
              }
              
              data.subBuilds.forEach(function(element, index, array){
                if(element.jobName =='PCR-REPT-Off_Target_Build_MultiJob'){
                  if (element.result==null){
                    ciStatus.buildWin32State.status = "running";
                    console.log("buildWin32State running");                     
                  }
                  else if(element.result=="SUCCESS"){
                    ciStatus.buildWin32State.status = "done";
                    console.log("buildWin32State done");                      
                  }
                } else if(element.jobName =='PCR-REPT-Off_Target_Test_MultiJob'){
                  if (element.result==null){
                    ciStatus.testWin32State.status= "running";
                    console.log("testWin32State running");                      
                  }
                  else if(element.result=="SUCCESS"){
                    ciStatus.testWin32State.status = "done";
                    console.log("testWin32State done");                      
                  }
                }
              });
          });
          }
        }
      })
    }  
}
function pushdata(id,duration,submitter,timestamp,data){



	duration.push(data.duration/(60000)); //convert to minute

	id.push(data.id);
	//durationDic.timestamp.push(data[i].timestamp);
	timestamp.push(data.timestamp);
	//get submitter name
	//parameter=data.actions[0].parameters;
	//console.log(parameters);

    submitter.push(getParameterValue(data,"SUBMITTER")); 

}

function getJobDuration(job,prjName,days,callback){

	var oldestTimeStamp = (Math.round(new Date().getTime()))-(days * 24 * 60 * 60 * 1000);
    var durationDic = {"id":[],"duration":[],"submitter":[],"timestamp":[]};
	err =""
    fiber(function() {
        var server = new Server('127.0.0.1');
        var db = server.db("booster");
        var objPrj = {"name":"PROJECT_NAME","value":prjName}
       
        var coll = db.getCollection(getJobCollName(job));
        var docs = coll.find({"result":"SUCCESS","timestamp":{$gt:oldestTimeStamp},"actions.parameters": {$in: [objPrj]}}).toArray();
        
        for( var i =0 ; i< docs.length;i++){
            pushdata(durationDic.id,durationDic.duration,durationDic.submitter,durationDic.timestamp,docs[i]);  
        }
        callback(err,durationDic);
        server.close();
    }).run();
    
}

function getJobFailureInfo(job,days,callback){

	var oldestTimeStamp = (Math.round(new Date().getTime()))-(days * 24 * 60 * 60 * 1000);
	var subBuilds;

	var failureInfoDic={};
	failureInfoDic['allBuildNumber'] =0;
	failureInfoDic['failureNumber'] =0;
	failureInfoDic['abortedNumber'] =0;
	failureInfoDic['failBuildName'] =new Array("Pre","PCR-REPT-Git-Integration","PCR-REPT-On_Target_MultiJob","PCR-REPT-Off_Target_MultiJob","PCR-REPT-Git-Release");
	failureInfoDic['failBuildNum'] =new Array(0,0,0,0,0);
	failureInfoDic['failSubmitter'] =new Array();
	failureInfoDic['failTimeStamp'] =new Array();
    
    
	err =""
    fiber(function() {
        var server = new Server('127.0.0.1');
        var db = server.db("booster");
       
        var coll = db.getCollection(getJobCollName(job));
        failureInfoDic['allBuildNumber'] = coll.find({"timestamp":{$gt:oldestTimeStamp}}).count();
        failureInfoDic['abortedNumber'] = coll.find({"result": "ABORTED","timestamp":{$gt:oldestTimeStamp}}).count();
        console.log(job)
        var docFs = coll.find({"result": "FAILURE","timestamp":{$gt:oldestTimeStamp}}).toArray()

        for( var i =0 ; i< docFs.length;i++){
            failureInfoDic['failureNumber']++;
            failureInfoDic.failTimeStamp.push(docFs[i].timestamp); 
            subBuilds = docFs[i].subBuilds;
            if (subBuilds.length == 0)
            {
                failureInfoDic.failBuildNum[0]++; 
			 }
			 else
			 {
			     for(var sub =0;sub < subBuilds.length;sub++)
			    {
			        if(subBuilds[sub].result== "FAILURE")
				    {
				        for(var j = 1;j<failureInfoDic.failBuildName.length;j++)
				        {
				           if(subBuilds[sub].jobName == failureInfoDic.failBuildName[j])
                            {
							     failureInfoDic.failBuildNum[j]++;
								continue;
				            }
				         }
				    }
				}
			 }

             failureInfoDic.failSubmitter.push(getParameterValue(docFs[i],"SUBMITTER"));  
        }
        callback(err,failureInfoDic);
        server.close();
    }).run();
	
}

var ciUnblock = function(projName,jenkinsUnlock,boosterUnlock){
    console.log('ciUnblock')
    status = "SUCCESS";
    if (jenkinsUnlock == "TRUE"){
        jenkinsCIJob(CI_TRIGGER_JOB[projName],"enable")
    }
    if(boosterUnlock == "TRUE"){
        if(CISTATUS[projName].ciBlockInfo.result == "FAILURE"){
            var subject = '[Notice!] '+projName+' CI is unblocked'
            var msg ="You can submit your CI now"
            var args={'msg':msg,'subject':subject,"email":"rept-ci@googlegroups.com"}
            email.send(args)
        }
        CISTATUS[projName].ciBlockInfo.manualControl = "TRUE"
        CISTATUS[projName].ciBlockInfo.result = "SUCCESS"
    }

    return status
}
var updateOnTargetTestStatus = function(ciBlockInfo,data,job){
    var preResult = ciBlockInfo.result;
    var preReleaseTag = ciBlockInfo.releaseTag;
    var prjName=getParameterValue(data,"PROJECT_NAME");

    ciBlockInfo.result = data.result;
    ciBlockInfo.releaseTag=getParameterValue(data,"NEW_BASELINE");
    ciBlockInfo.submitter="";
    ciBlockInfo.lastSuccessTag="";
    
    console.log("ciBlock result:"+ciBlockInfo.result)

    //ciBlockInfo.submitter=getParameterValue(data,"SUBMITTER");
    if((ciBlockInfo.manualControl == "TRUE") && (preReleaseTag == ciBlockInfo.releaseTag)){
        ciBlockInfo.result = "SUCCESS"
    }
    else if (ciBlockInfo.result == "FAILURE"){
        ciBlockInfo.manualControl = "FALSE"
        console.log("CI is blocked")
        fiber(function() {
            var server = new Server('127.0.0.1');
            var db = server.db("booster");
            var objPrj = {"name":"PROJECT_NAME","value":prjName}
            //get last success tag
            var datColl = db.getCollection(getJobCollName(job));
            var docLastS = datColl.find({"result":"SUCCESS","IDAT_EXIT_CODES":{"$in":[[],["0"],["0","0"]]},"actions.parameters": {$in: [objPrj]}}).sort({"number": -1}).limit(1).toArray()
            if (docLast.length!=0){
                ciBlockInfo.lastSuccessTag = getParameterValue(docLastS[0],"NEW_BASELINE")
        
                var rlsColl = db.getCollection(getJobCollName(CI_RELEASE_JOB));
                var objS = {"name": "NEW_BASELINE", "value": ciBlockInfo.lastSuccessTag};
                var objF = {"name": "NEW_BASELINE", "value": ciBlockInfo.releaseTag};
                var docS = rlsColl.findOne({"actions.parameters": {$in: [objS]}});
                var docF = rlsColl.findOne({"actions.parameters": {$in: [objF]}});
                var docs = rlsColl.find({"number": {$gt: docS["number"],$lte: docF["number"]},"actions.parameters": {$in: [objPrj]}}).toArray();

                var submitter = "";
                docs.forEach(function(doc) {
                
                    submitter = submitter + findParamValue(doc, "SUBMITTER")+";";
   
                });
                ciBlockInfo.submitter = submitter;
            }
            if (preResult == "SUCCESS"){
                var msg = "Block Reason:  DAT test failed on tag :" +ciBlockInfo.releaseTag +"\n The Submitter(s):" +ciBlockInfo.submitter+"\n Last Success Tag:"+ciBlockInfo.lastSuccessTag;
                var subject = '[Notice!]'+prjName+' CI is blocked'
                var args={'msg':msg,'subject':subject,"email":"rept-ci@googlegroups.com"}
                email.send(args)
            }

            server.close();
        }).run();
        if (preResult == "SUCCESS" ){
            // send email to the submitters whoes CI is canceled
            getPendingReq(prjName, function(err, data){
                if (err) {
                    console.log(err);
                    return;
                }
                var msg = "Cancel Reasion : DAT test failed , CI blocked \n please resubmit your CI after CI unblocked"

                data["queue"].forEach(function(pendingCI) {
                    var submail = pendingCI["submail"];
                    var name = pendingCI["submitter"];
                    var branch = pendingCI["subBranch"];
                    var commitId = pendingCI["subCommitId"];
                    var subject = "[Notice!] Your CI : "+branch+":"+commitId+" is canceled"
                    var args={'msg':msg,'subject':subject,"email":submail}
                    email.send(args)
                });
                //disable PCR-REPT-0-MultiJob
                jenkinsCIJob(CI_TRIGGER_JOB[prjName],"disable")
            });
        }
    }
    else if(ciBlockInfo.result == "SUCCESS"){
        //let CI unblocked
        ciBlockInfo.manualControl = "FALSE"
        if (preResult == "FAILURE"){
            ciUnblock(prjName,"TRUE","FALSE")
            var subject = '[Notice!]'+prjName+' CI is unblocked'
            var msg ="You can submit your CI now"
            var args={'msg':msg,'subject':subject,"email":"rept-ci@googlegroups.com"}
            email.send(args)
            console.log ("CI unblocked")
        }
    }
}

var onTargertTestInfo = function(job){

    ALL_PRJ.forEach(function(prjName){
        fiber(function() {
            var server = new Server('127.0.0.1');
            var db = server.db("booster");
            var objPrj = {"name":"PROJECT_NAME","value":prjName}
            //get last tag
            var coll = db.getCollection(getJobCollName(job));
            var docLast = coll.find({"actions.parameters": {$in: [objPrj]}}).sort({"number": -1}).limit(1).toArray()
            if (docLast.length!=0){
                updateOnTargetTestStatus(CISTATUS[prjName].ciBlockInfo,docLast[0],job);
            }
            server.close();
        }).run();        

    })
}

var updateLatestBuildInfo = function(prjName){
    job = CI_TRIGGER_JOB[prjName]
    getJobLastBuild(job,function(err,data){
        if(err) 
        {
          console.log("err in getJobLastBuild");
          return;
        }
      
        updateStatus(CISTATUS[prjName],data); 
       
       
    });
}

var findParamValue = function(buildInfo, paramName) {
    if (!buildInfo || !buildInfo["actions"]) {
        return;
    }

    for (var i = 0; i < buildInfo["actions"].length; ++i) {
        if (!buildInfo["actions"][i]["parameters"])
            continue;

        var params = buildInfo["actions"][i]["parameters"];
        for (var j = 0; j < params.length; ++j) {
            if (params[j]["name"] == paramName) {
                return params[j]["value"];
            }
        }
    }

    return;
}

var findSubBuildInfo = function(parentBuild, subBuildName) {
    var allSubBuilds = [];

    // If the parent build is a multi-job build, info of its sub-builds is saved in the 
    // field "subBuilds", ortherwise, the info is saved in the field subBuilds of field build
    if (parentBuild["subBuilds"]) {
        allSubBuilds.push(parentBuild["subBuilds"]);
    }
    else if (parentBuild["build"] && parentBuild["build"]["subBuilds"]) {
        allSubBuilds.push(parentBuild["build"]["subBuilds"]);
    }

    // Retrive all sub-builds of parent build and sub-builds of sub-builds of the parent build
    // if any to get build info of the specified sub-build
    for (var i = 0; i < allSubBuilds.length; ++i) {
        var subBuilds = allSubBuilds[i];

        for (var j = 0; j < subBuilds.length; ++j) {
            var subBuild = subBuilds[j];

            if (subBuild["jobName"] == subBuildName) {
                return subBuild;
            }
            if (subBuild["build"] && subBuild["build"]["subBuilds"]) {
                allSubBuilds.push(subBuild["build"]["subBuilds"]);
            }
        }
    }

    return;
}

var getJobCollName = function(jobName) {
    return 'CI-' + jobName;
}

var refreshCIHistory = function(db, doc,prjName) {
    var entry = {};
    var itPart1 = undefined, itPart2 = undefined, itDist = undefined;
    var allSubJobs = [CI_PRECHECK_JOB, CI_ON_TAEGET_BUILD_JOB, CI_OFF_TARGET_BUILD_JOB, CI_OFF_TARGET_UT_JOB, CI_OFF_TARGET_IT_DIST_JOB, CI_OFF_TARGET_IT_PART1_JOB, CI_OFF_TARGET_IT_PART2_JOB];
    
    entry["buildID"] = doc["number"];
    entry["buildResult"] = doc["result"];
    entry["startTime"] = doc["timestamp"];
    entry["submitter"] = findParamValue(doc, "SUBMITTER");
    entry["pushTime"] = findParamValue(doc, "PUSH_TIME");
    entry["queuewTime"] = entry["startTime"] - entry["pushTime"];
    entry["duration"] = doc["duration"];

    // Build results of all sub-builds
    // Note: The original IT test job is divided into two parts: it-part1 and it-part2,
    // but now these two parts have been merged into one: it-dist. Both the cases should be
    // considered for compatibility.
    for (var i = 0; i < allSubJobs.length; ++i) {
        var subJobName = allSubJobs[i];
        var entryKey = keyMap[subJobName];
        var buildInfo = findSubBuildInfo(doc, subJobName);

        if (buildInfo) {
            if (subJobName == CI_OFF_TARGET_IT_PART1_JOB) {
                itPart1 = buildInfo["result"];
            }
            else if (subJobName == CI_OFF_TARGET_IT_PART2_JOB) {
                itPart2 = buildInfo["result"];
            }
            else if (subJobName == CI_OFF_TARGET_IT_DIST_JOB) {
                itDist = buildInfo["result"];
            }
            else {
                entry[entryKey] = buildInfo["result"];
            }
        }
    }
    if (itDist == "SUCCESS"
        || (itPart1 == "SUCCESS" && itPart2 == "SUCCESS")) {
        entry[keyMap[CI_OFF_TARGET_IT_JOB]] = "SUCCESS";
    }
    else if (itDist || itPart1 || itPart2){
        entry[keyMap[CI_OFF_TARGET_IT_JOB]] = "FAILURE";
    }

    // Coverage
    var subBuildCov = findSubBuildInfo(doc, CI_COVERAGE_CHECK_JOB);
    if (subBuildCov) {
      
        if (subBuildCov["result"] != "SUCCESS"){
          entry["coverage"] = "FAILURE";
        }
        else{
          var number = subBuildCov["buildNumber"];
          var covInfo = db.getCollection(getJobCollName(CI_COVERAGE_CHECK_JOB)).findOne({"number": number});

          if (covInfo) {
              entry["coverage"] = covInfo["coverage"];
          }          
        }
    }

    // Release time/release tag/code static check/sanity test/extended regression test
    if (entry["buildResult"] == "SUCCESS") {
        var subBuildRls = findSubBuildInfo(doc, CI_RELEASE_JOB);

        if (subBuildRls) {
            var number = subBuildRls["buildNumber"];
            var rlsInfo = db.getCollection(getJobCollName(CI_RELEASE_JOB)).findOne({"number": number});
    
            if (rlsInfo) {
                var buildWarnings = 0;
                var rlsTag = findParamValue(rlsInfo, "NEW_BASELINE");
                var warnings = db.getCollection(CI_WARNING_COLL_NAME).find({"releaseTag": rlsTag}).toArray();
                var rlsDate = new Date(doc["timestamp"] + doc["duration"]);
    
                entry["rlsTag"] = rlsTag;
                entry["rlsTime"] = rlsDate.toLocaleDateString() + " " + rlsDate.toLocaleTimeString();
                for (var i = 0; i < warnings.length; ++i) {
                    buildWarnings += warnings[i]["buildWarningCnt"];
                }
                
                entry["codeStaticCheck"] = {"build": buildWarnings, "klocwork": '--'};
            }
        }
    }

    CIHistory[prjName].push(entry);
    if (entry["buildID"] > CILastTriggerBuildID[prjName]) {
        CILastTriggerBuildID[prjName] = entry["buildID"];
    }
}

var updateCIHistoryInfo = function() {
    // Delta update
    fiber(function() {
        var server = new Server('127.0.0.1');
        var db = server.db("booster");
        // Maybe the same release version will be tested many times, we only care the last one, so we
        // sort the results in descending order
        var sanityDocs = db.getCollection(getJobCollName(CI_SANITY_TEST_JOB)).find({"number": {$gt: CILastSanityBuildID}}).sort({"number": -1}).toArray();
        var extRegressionDocs = db.getCollection(getJobCollName(CI_EXT_REGRESSION_JOB)).find({"number": {$gt: CILastExtRegressionBuildID}}).sort({"number": -1}).toArray();
        var memoryLeakDocs = db.getCollection(getJobCollName(CI_MEMORY_LEAK_JOB)).find({"number": {$gt: CIMemoryLeakBuildID}}).sort({"number": -1}).toArray();
        
        var klocworkDocs = db.getCollection(CI_KLOCWORK_COLL_NAME).find({"buildNumber": {$gt: CILastKlocworkBuildID}}).sort({"buildNumber": -1}).toArray();
        
        for (var key in CI_TRIGGER_JOB){
            var prjName =key
            var objPrj = {"name":"PROJECT_NAME","value":prjName}
            
            var triggerDocs = db.getCollection(getJobCollName(CI_TRIGGER_JOB[prjName])).find({"number": {$gt: CILastTriggerBuildID[prjName]},"actions.parameters": {$in: [objPrj]}}).sort({"number": 1}).toArray();
            triggerDocs.forEach(function(doc) {
                refreshCIHistory(db, doc,prjName);
            });
        };
        // The result of Sanity test, Extended Regression test and Memory Leak test of a new release
        // version can not be gotten immediately, so we should check the db periodically and update
        // them if necessary
        klocworkDocs.forEach(function(doc) {
            var rlsTag =doc['releaseTag'];
            var prjName = doc['PROJECT_NAME'];
            if (ALL_PRJ.indexOf(prjName) !== -1){
                for (var i = CIHistory[prjName].length-1; i >= 0; --i) {
                    if (rlsTag && CIHistory[prjName][i]["rlsTag"] == rlsTag) {
                        if (CIHistory[prjName][i]["codeStaticCheck"]) {
                            CIHistory[prjName][i]["codeStaticCheck"]["klocwork"] = doc['klocworkCnt'];
                            if (doc["buildNumber"] > CILastKlocworkBuildID) {
                                CILastKlocworkBuildID = doc["buildNumber"];
                            }
                        }
                        break;
                    }
                }
            }
        });
        sanityDocs.forEach(function(doc) {
            var rlsTag = findParamValue(doc, "NEW_BASELINE");
            var prjName = findParamValue(doc, "PROJECT_NAME");
            if (ALL_PRJ.indexOf(prjName) !== -1){
                for (var i = CIHistory[prjName].length-1; i >= 0; --i) {
                    if (rlsTag && CIHistory[prjName][i]["rlsTag"] == rlsTag) {
                        if (!CIHistory[prjName][i]["onTargetSanity"]) {
                        //datExitCodes value should like ['0','1','2']
                        //it contain all the exit codes return from DAT, including succeeded or failed code
                            datExitCodes = doc['IDAT_EXIT_CODES']
                        
                        // assign a default value for on Target result
                            CIHistory[prjName][i]["onTargetSanity"] = doc["result"];
                        
                        //itr all codes, if have non 0(Success) and non 5(TestCaseFailed) value, means have system err happen, assign 'DAT sys error' string
                        /*below is enum of exitcode
                                public enum AutoTestTaskExResultForTrigger
                                {
                                    Success,
                                    ParameterError,
                                    CreateTaskFailed,
                                    EnvironmentInitFailed,          // USB Fail, Flash Fw Fail
                                    TaskAborted,
                                    TestCaseFailed,

                                    UnknownError = 999
                                }                        
                        */
                            if (datExitCodes){
                              for (var index=0;index<datExitCodes.length;index++)             
                                if(datExitCodes[index] != '0' && datExitCodes[index] != '5')
                                  CIHistory[prjName][i]["onTargetSanity"] = 'DAT sys error ' + datExitCodes[index]
                                  break                          
                            }
    
                        
                            if (doc["number"] > CILastSanityBuildID) {
                                CILastSanityBuildID = doc["number"];
                            }
                        }
                        break;
                    }
                }
            }
        });
        extRegressionDocs.forEach(function(doc) {
            var rlsTag = findParamValue(doc, "NEW_BASELINE");
            var prjName = findParamValue(doc, "PROJECT_NAME");
            if (ALL_PRJ.indexOf(prjName) !== -1){
                for (var i = CIHistory[prjName].length-1; i >= 0; --i) {
                    if (rlsTag && CIHistory[prjName][i]["rlsTag"] == rlsTag) {
                        if (!CIHistory[prjName][i]["extRegression"]){
                            CIHistory[prjName][i]["extRegression"] = doc["result"];
                            if (doc["number"] > CILastExtRegressionBuildID) {
                                CILastExtRegressionBuildID = doc["number"];
                            }
                        }
                        break;
                    }
                }
            }
        });
        memoryLeakDocs.forEach(function(doc) {
            var rlsTag = findParamValue(doc, "NEW_BASELINE");
            var prjName = findParamValue(doc, "PROJECT_NAME");
            if (ALL_PRJ.indexOf(prjName) !== -1){
                for (var i = CIHistory[prjName].length-1; i >= 0; --i) {
                    if (rlsTag && CIHistory[prjName][i]["rlsTag"] == rlsTag) {
                        if (!CIHistory[prjName][i]["memoryLeak"]) {
                            CIHistory[prjName][i]["memoryLeak"] = doc["result"];
                            if (doc["number"] > CIMemoryLeakBuildID) {
                                CIMemoryLeakBuildID = doc["number"];
                            }
                        }
                        break;
                    }
                }
            }
        }); 


        server.close();
    }).run();

}

updateCIHistoryInfo();
setInterval(function(){
    // block CI depends on DAT status 
    onTargertTestInfo('PCR-REPT-DAT_LATEST');
    // runing CI status
    ALL_PRJ.forEach(function(prjName){
        updateLatestBuildInfo(prjName); 
    });

}, GET_JENKINS_INTERVAL);

setInterval(function() {
    updateCIHistoryInfo();
}, CI_HISTORY_INTERVAL);


/* GET feedback about git page. */
router.get('/getCIStatus/:prj', function(req, res, next) {

  var projName = req.params.prj;

  if (ALL_PRJ.indexOf(projName) !== -1){
      return res.json(CISTATUS[projName]); 
  }
});

router.get('/getCIPendingReq/:prj', function(req, res, next){

  var projName = req.params.prj;
  if (ALL_PRJ.indexOf(projName) !== -1){
        getPendingReq(projName, function(err, data){
            if (err) { return res.end(); }
            data.current.submitter = CISTATUS[projName].overall.current.submitter;
            data.current.subTime = CISTATUS[projName].overall.current.subTime;
            data.current.subBranch = CISTATUS[projName].overall.current.subBranch; 
            data.current.subCommitId = CISTATUS[projName].overall.current.subCommitId;
            return res.json(data);
        });
  }
});


router.get('/dashboard', function(req, res, next){
    res.render('CIDashboard',{ title: 'CI DashBoard' });
})

router.get('/getOnTargetBuild/:prj', function(req, res, next){
  var projName = req.params.prj;
  if (ALL_PRJ.indexOf(projName) !== -1){
      getJobDuration('PCR-REPT-On_Target_Build_MultiJob',projName,days,function(err,data){
        return res.json(data);
     });
  }
})

router.get('/getOnTargetTest/:prj', function(req, res, next){

  var projName = req.params.prj;
  if (ALL_PRJ.indexOf(projName) !== -1){
      getJobDuration('PCR-REPT-DAT_LATEST',projName,days,function(err,data){
        return res.json(data);
      });
  }
})

router.get('/getOffTargetBuild/:prj', function(req, res, next){

  var projName = req.params.prj;
  if (ALL_PRJ.indexOf(projName) !== -1){
      
      getJobDuration('PCR-REPT-Off_Target_Build_MultiJob',projName,days,function(err,data){
        return res.json(data);
      });
  }
})

router.get('/getOffTargetTest/:prj', function(req, res, next){

  var projName = req.params.prj;
  if (ALL_PRJ.indexOf(projName) !== -1){ 
      getJobDuration('PCR-REPT-Off_Target_Test_MultiJob',projName,days,function(err,data){
        return res.json(data);
      });
  }
})

router.get('/getTheWholeCI/:prj', function(req, res, next){

  var projName = req.params.prj;
  if (ALL_PRJ.indexOf(projName) !== -1){
      getJobDuration(CI_TRIGGER_JOB[projName],projName,days,function(err,data){
        return res.json(data);
      });
  }
})


router.get('/getFailInfo/:prj', function(req, res, next){
  var projName = req.params.prj;
  if (ALL_PRJ.indexOf(projName) !== -1){
      getJobFailureInfo(CI_TRIGGER_JOB[projName],days,function(err,data){
        return res.json(data);
      });
  }
})

router.get('/getCIHistory/:prj', function(req, res, next){

   var projName = req.params.prj;
   if (ALL_PRJ.indexOf(projName) !== -1){
      return res.json(CIHistory[projName]);
   }
})
router.get('/ControlPanel', function(req, res, next){
    res.render('controlPanel',{ title: 'unblock CI' });
})
router.get('/infraDashboard', function(req, res, next){
    res.render('infraDashboard',{ title: 'infra Dashboard' });
})
router.post('/doUnblockCI', function(req, res, next) {
    var jenkinsci = req.body.jenkinsCI;
    var boosterdisplay = req.body.boosterdisplay;
    var password = req.body.password;
    var project = req.body.project;
    
    passWord.verify("unblock",password,function(result){
        if (result){
            status = ciUnblock(project,jenkinsci,boosterdisplay)
        }
        else{
            status = "Invalid password"
        }
        res.send(status)
        return false;
    })
})
  
router.post('/removePendingItem', function(req, res, next) {
    var id = req.body.id;
    var submitter = req.body.submitter;
    var submitBranch = req.body.submitBranch;
    console.log("/removePendingItem",id,submitter,submitBranch)
   
    jenkins.cancel_item(id, function(err) {
        if (err) {
            console.log("failed to cancel item["+id.toString()+"]"+err);
            res.send("false")
        }
        else {
            console.log("succeeded to cancel item["+id.toString()+"]");
            res.send("true")
        }
    });    
    
    return false;    
})  

module.exports = router;
