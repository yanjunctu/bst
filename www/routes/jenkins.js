var express = require('express');
var router = express.Router();
var jenkins = require('../models/jenkins.js');
var email = require('../models/email.js');
var jenkinsCIJob = require('../models/jenkinsJob.js');
var fiber = require('fibers');
var Server = require('mongo-sync').Server;
var cnt=0;
var GET_JENKINS_INTERVAL = 15000; // 15seconds
var CI_HISTORY_INTERVAL = 60000*20; // 20 minutes
var days=30;
var CISTATUS = {
  "idleState":{"status":"running","duration":0},
  "preCheckState":{"status":"not start","duration":2},
  "buildFwState":{"status":"not start","duration":3},
  "testFwState":{"status":"not start","duration":4},
  "buildWin32State":{"status":"not start","duration":5},
  "testWin32State":{"status":"not start","duration":0},
  "preReleaseState":{"status":"not start","duration":0},
  "overall":{"current":{"branch":"na","subTime":"na"}},
  "ciBlockInfo":{"result":"SUCCESS","submitter":"na","releaseTag":"na",lastSuccessTag:"na",manualControl:"FALSE"}
};  

// Variables for CI history info
const CI_TRIGGER_JOB = "PCR-REPT-0-MultiJob";
const CI_ON_TARGET_JOB = "PCR-REPT-On_Target_MultiJob";
const CI_ON_TAEGET_BUILD_JOB = "PCR-REPT-On_Target_Build_MultiJob";
const CI_OFF_TARGET_JOB = "PCR-REPT-Off_Target_MultiJob";
const CI_OFF_TARGET_BUILD_JOB = "PCR-REPT-Off_Target_Build_MultiJob";
const CI_OFF_TARGET_TEST_JOB = "PCR-REPT-Off_Target_Test_MultiJob";
const CI_OFF_TARGET_UT_JOB = "PCR-REPT-Win32_UT";
const CI_OFF_TARGET_IT_JOB = "PCR-REPT-Win32_IT"; // This is not a real jenkins job, it is defined as a key 
const CI_OFF_TARGET_IT_PART1_JOB = "PCR-REPT-Win32_IT-TEST-Part1";
const CI_OFF_TARGET_IT_PART2_JOB = "PCR-REPT-Win32_IT-TEST-Part2";
const CI_COVERAGE_CHECK_JOB = "PCR-REPT-Win32_COV_CHECK";
const CI_RELEASE_JOB = "PCR-REPT-Git-Release";
const CI_PRECHECK_JOB = "PCR-REPT-Git-Integration";
const CI_SANITY_TEST_JOB = "PCR-REPT-DAT_LATEST";
const CI_EXT_REGRESSION_JOB = "PCR-REPT-DAT_DAILY";
const CI_MEMORY_LEAK_JOB = "PCR-REPT-Memory_Leak_MultiJob-DAILY";
const CI_WARNING_COLL_NAME = "warningKlocwork";
const CI_KLOCWORK_COLL_NAME = "klocwork";
var CILastTriggerBuildID = 0, CILastSanityBuildID = 0, CILastExtRegressionBuildID = 0,CIMemoryLeakBuildID=0;
var CIHistory = [];
var keyMap = {};

// Associate job names with keys of CI history info
keyMap[CI_PRECHECK_JOB] = "precheck";
keyMap[CI_ON_TAEGET_BUILD_JOB] = "onTargetBuild";
keyMap[CI_OFF_TARGET_BUILD_JOB] = "offTargetBuild";
keyMap[CI_OFF_TARGET_UT_JOB] = "win32UT";
keyMap[CI_OFF_TARGET_IT_JOB] = "win32IT";
keyMap[CI_OFF_TARGET_IT_PART1_JOB] = "win32ITPart1";
keyMap[CI_OFF_TARGET_IT_PART2_JOB] = "win32ITPart2";

const CI_JOB='PCR-REPT-0-MultiJob';

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
var getAllBuild = function (job,param,callback)
{
   jenkins.all_build(job,param,function(err, tempdata) {
    data={};
    if (tempdata.hasOwnProperty("allBuilds")) {
       data = tempdata.allBuilds;
    }
	   
    callback(err,data);
  });  
};
var getJobLastCompletedBuild = function(job,callback)
{
  var result;
  jenkins.last_completed_build_info(job, function(err, data) {
    callback(err,data);
  });

};
var getJobLastSuccessBuild = function(job,callback)
{
  var result;
  jenkins.last_success(job, function(err, data) {
    callback(err,data);
  });

};
function getParameterValue(data,parameter){
  var actions = data.actions;
  var found;
  
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
        {
          //console.log()
        }
          
      })
    }
  }
  );
  return found;
}


function getPendingReq(project, callback){
    var result = {"current":{"submitter":"","subBranch":"","subTime":0},"queue":[]};

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
                    var projName = '';
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
                        if (jobName && submitter && branch && pushTime){
                     
                            console.log('jobname:'+item.task.name);
                                        console.log(submitter,branch,pushTime,submail);
                            result.queue.push({"id": id,"submitter":submitter,"subBranch":branch,"subTime":pushTime,"submail":submail});
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
    if (data.building==false){
      //return res.json(ciStatus);
      ciStatus.idleState.status="running";
    }else {
      ciStatus.idleState.status="done"; 
      ciStatus.overall.current.submitter= getParameterValue(data,"SUBMITTER");//data.actions[0].parameters[1].value;
      ciStatus.overall.current.subBranch= getParameterValue(data,"IR_BRANCH");//data.actions[0].parameters[1].value;      
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

function getJobDuration(job,days,callback){

	var oldestTimeStamp = (Math.round(new Date().getTime()))-(days * 24 * 60 * 60 * 1000);
    var durationDic = {"id":[],"duration":[],"submitter":[],"timestamp":[]};
	
	
	var parameters;
	var param = 'id,duration,result,timestamp,actions[parameters[*]]'
	
    getAllBuild(job,param,function(err,data){
    if(err) 
    {
      console.log("err in getJobDuration");
      return;
    }

	for (var i = 0; i < data.length; i++) 
	{
	    if(data[i].timestamp > oldestTimeStamp)
		{
		   if((data[i].result == "SUCCESS") && ("REPT2.7" == getParameterValue(data[i],"PROJECT_NAME")))
		   {
               pushdata(durationDic.id,durationDic.duration,durationDic.submitter,durationDic.timestamp,data[i]);

		   }
		}
		else
		{
			callback(err,durationDic);
			return;
		}
	}
	callback(err,durationDic);
	return;
	})
}

function getJobFailureInfo(job,days,callback){

	var oldestTimeStamp = (Math.round(new Date().getTime()))-(days * 24 * 60 * 60 * 1000);
	var param = 'timestamp,result,subBuilds[*],actions[parameters[*]]'
	var subBuilds;
	var parameters;
	var failureInfoDic={};
	failureInfoDic['allBuildNumber'] =0;
	failureInfoDic['failureNumber'] =0;
	failureInfoDic['abortedNumber'] =0;
	failureInfoDic['failBuildName'] =new Array("Pre","PCR-REPT-Git-Integration","PCR-REPT-On_Target_MultiJob","PCR-REPT-Off_Target_MultiJob","PCR-REPT-Git-Release");
	failureInfoDic['failBuildNum'] =new Array(0,0,0,0,0);
	failureInfoDic['failSubmitter'] =new Array();
	failureInfoDic['failTimeStamp'] =new Array();
	
	
    getAllBuild(job,param,function(err,data){
    if(err) 
    {
      console.log("err in getJobFailureInfo");
      return;
    }
	for (var i = 0; i < data.length; i++) 
	{
	    if(data[i].timestamp > oldestTimeStamp)
		{
		   failureInfoDic['allBuildNumber']++;
		   if(data[i].result== "FAILURE")
		   {
		       failureInfoDic['failureNumber']++;
			   failureInfoDic.failTimeStamp.push(data[i].timestamp); 
			   subBuilds = data[i].subBuilds;
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

				failureInfoDic.failSubmitter.push(getParameterValue(data[i],"SUBMITTER")); 
   
		   }
		   else if(data[i].result== "ABORTED")
		   {
		       failureInfoDic['abortedNumber']++;
		   }

		}
		else
		{
			callback(err,failureInfoDic);
			return;
		}
	}
    callback(err,failureInfoDic);
	return;
	})
}
var passwordVerify=function(user,password,callback){
    ret = false
    var server = new Server('127.0.0.1');
    fiber(function() {

        var db = server.db("booster");
        var doc = db.getCollection('booster_password').find({"user": {$eq:user}}).toArray();
        var dbPassword = doc[0]["password"]
        if(password ==dbPassword ){
            ret = true
        }
        callback(ret)
    }).run();
    server.close();
}
var ciUnblock = function(jenkinsUnlock,boosterUnlock){
    console.log('ciUnblock')
    status = "SUCCESS";
    if (jenkinsUnlock == "TRUE"){
        jenkinsCIJob(CI_JOB,"enable")
    }
    if(boosterUnlock == "TRUE"){
        if(CISTATUS.ciBlockInfo.result == "FAILURE"){
            var subject = '[Notice!] CI is unblocked'
            var msg ="You can submit your CI now"
            var args={'msg':msg,'subject':subject,"email":"rept-ci@googlegroups.com"}
            email.send(args)
        }
        CISTATUS.ciBlockInfo.manualControl = "TRUE"
        CISTATUS.ciBlockInfo.result = "SUCCESS"
    }
    console.log(CISTATUS.ciBlockInfo)
    return status
}
var updateOnTargetTestStatus = function(ciBlockInfo,data,job){
    var preResult = ciBlockInfo.result;
    var preReleaseTag = ciBlockInfo.releaseTag;

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
        getJobLastSuccessBuild(job,function(err,data){
            if(err) {
                console.log("err in onTargertTestInfo");
                return;
            }
            ciBlockInfo.lastSuccessTag=getParameterValue(data,"NEW_BASELINE");

            var server = new Server('127.0.0.1');
            fiber(function() {
                var db = server.db("booster");
                var rlsColl = db.getCollection(getJobCollName(CI_RELEASE_JOB));
                var objS = {"name": "NEW_BASELINE", "value": ciBlockInfo.lastSuccessTag};
                var objF = {"name": "NEW_BASELINE", "value": ciBlockInfo.releaseTag};
                var docS = rlsColl.findOne({"actions.parameters": {$in: [objS]}});
                var docF = rlsColl.findOne({"actions.parameters": {$in: [objF]}});
                var docs = rlsColl.find({"number": {$gt: docS["number"],$lte: docF["number"]}}).toArray();

                var submitter = "";
                docs.forEach(function(doc) {
                   if(findParamValue(doc, "PROJECT_NAME") == "REPT2.7"){
                       submitter = submitter + findParamValue(doc, "SUBMITTER")+";";
                   }
                   
                });
                ciBlockInfo.submitter = submitter;
                if (preResult == "SUCCESS"){
                    var msg = "Block Reason:  DAT test failed on tag :" +ciBlockInfo.releaseTag +"\n The Submitter(s):" +ciBlockInfo.submitter+"\n Last Success Tag:"+ciBlockInfo.lastSuccessTag;
                    var subject = '[Notice!] CI is blocked'
                    var args={'msg':msg,'subject':subject,"email":"rept-ci@googlegroups.com"}
                    email.send(args)
                }
            }).run();

            server.close();
        });
        if (preResult == "SUCCESS" ){
            // send email to the submitters whoes CI is canceled
            getPendingReq("REPT2.7", function(err, data){
                if (err) {
                    console.log(err);
                    return;
                }
                var msg = "Cancel Reasion : DAT test failed , CI blocked \n please resubmit your CI after CI unblocked"

                data["queue"].forEach(function(pendingCI) {
                    var submail = pendingCI["submail"];
                    var name = pendingCI["submitter"];
                    var branch = pendingCI["subBranch"];
                    var subject = "[Notice!] Your CI : "+branch+" is canceled"
                    var args={'msg':msg,'subject':subject,"email":submail,"name":name}
                    email.send(args)
                });
                //disable PCR-REPT-0-MultiJob
                jenkinsCIJob(CI_JOB,"disable")
            });
        }
    }
    else if(ciBlockInfo.result == "SUCCESS"){
        //let CI unblocked
        ciBlockInfo.manualControl = "FALSE"
        if (preResult == "FAILURE"){
            ciUnblock("TRUE","FALSE")
            var subject = '[Notice!] CI is unblocked'
            var msg ="You can submit your CI now"
            var args={'msg':msg,'subject':subject,"email":"rept-ci@googlegroups.com"}
            email.send(args)
            console.log ("CI unblocked")
        }
    }
}

var onTargertTestInfo = function(job){

    getJobLastCompletedBuild(job,function(err,data){
        if(err) 
        {
            console.log("err in onTargertTestInfo");
            return;
        }

        updateOnTargetTestStatus(CISTATUS.ciBlockInfo,data,job);  
    });
}

var updateLatestBuildInfo = function(job){
    
    getJobLastBuild(job,function(err,data){
        if(err) 
        {
          console.log("err in getJobLastBuild");
          return;
        }
    
        updateStatus(CISTATUS,data); 
       
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

var refreshCIHistory = function(db, doc) {
    var entry = {};
    var allSubJobs = [CI_PRECHECK_JOB, CI_ON_TAEGET_BUILD_JOB, CI_OFF_TARGET_BUILD_JOB, CI_OFF_TARGET_UT_JOB, CI_OFF_TARGET_IT_PART1_JOB, CI_OFF_TARGET_IT_PART2_JOB];
    
    entry["buildID"] = doc["number"];
    entry["buildResult"] = doc["result"];
    entry["startTime"] = doc["timestamp"];
    entry["submitter"] = findParamValue(doc, "SUBMITTER");
    entry["pushTime"] = findParamValue(doc, "PUSH_TIME");
    entry["queuewTime"] = entry["startTime"] - entry["pushTime"];
    entry["duration"] = doc["duration"];

    // Build results of all sub-builds
    for (var i = 0; i < allSubJobs.length; ++i) {
        var subJobName = allSubJobs[i];
        var entryKey = keyMap[subJobName];
        var buildInfo = findSubBuildInfo(doc, subJobName);

        if (buildInfo) {
            // There are two IT related jobs, we should merge these two jobs into one IT job
            if ((subJobName == CI_OFF_TARGET_IT_PART1_JOB)
                || (subJobName == CI_OFF_TARGET_IT_PART2_JOB)) {
                if (!("win32IT" in entry)) {
                    entry["win32IT"] = {}
                }
                entry["win32IT"][entryKey] = buildInfo["result"];
            }
            else {
                entry[entryKey] = buildInfo["result"];
            }
        }
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
                var klockworkIssue = db.getCollection(CI_KLOCWORK_COLL_NAME).find({"releaseTag": rlsTag}).toArray();
                var rlsDate = new Date(doc["timestamp"] + doc["duration"]);
    
                entry["rlsTag"] = rlsTag;
                entry["rlsTime"] = rlsDate.toLocaleDateString() + " " + rlsDate.toLocaleTimeString();
                for (var i = 0; i < warnings.length; ++i) {
                    buildWarnings += warnings[i]["buildWarningCnt"];
                }

                var klocworkWarnings = 0
                if (klockworkIssue.length >0){
                    klocworkWarnings = klockworkIssue[0]["klocworkCnt"];
                }
                
                entry["codeStaticCheck"] = {"build": buildWarnings, "klocwork": klocworkWarnings};
            }
        }
    }

    CIHistory.push(entry);
    if (entry["buildID"] > CILastTriggerBuildID) {
        CILastTriggerBuildID = entry["buildID"];
    }
}

var updateCIHistoryInfo = function() {
    var server = new Server('127.0.0.1');

    // Delta update
    fiber(function() {
        var db = server.db("booster");
        var triggerDocs = db.getCollection(getJobCollName(CI_TRIGGER_JOB)).find({"number": {$gt: CILastTriggerBuildID}}).sort({"number": 1}).toArray();
        // Maybe the same release version will be tested many times, we only care the last one, so we
        // sort the results in descending order
        var sanityDocs = db.getCollection(getJobCollName(CI_SANITY_TEST_JOB)).find({"number": {$gt: CILastSanityBuildID}}).sort({"number": -1}).toArray();
        var extRegressionDocs = db.getCollection(getJobCollName(CI_EXT_REGRESSION_JOB)).find({"number": {$gt: CILastExtRegressionBuildID}}).sort({"number": -1}).toArray();
        var memoryLeakDocs = db.getCollection(getJobCollName(CI_MEMORY_LEAK_JOB)).find({"number": {$gt: CIMemoryLeakBuildID}}).sort({"number": -1}).toArray();
         
        triggerDocs.forEach(function(doc) {
            refreshCIHistory(db, doc);
        });
        // The result of Sanity test, Extended Regression test and Memory Leak test of a new release
        // version can not be gotten immediately, so we should check the db periodically and update
        // them if necessary
        sanityDocs.forEach(function(doc) {
            var rlsTag = findParamValue(doc, "NEW_BASELINE");

            for (var i = CIHistory.length-1; i >= 0; --i) {
                if (rlsTag && CIHistory[i]["rlsTag"] == rlsTag) {
                    if (!CIHistory[i]["onTargetSanity"]) {
                        //datExitCodes value should like ['0','1','2']
                        //it contain all the exit codes return from DAT, including succeeded or failed code
                        datExitCodes = doc['IDAT_EXIT_CODES']
                        
                        // assign a default value for on Target result
                        CIHistory[i]["onTargetSanity"] = doc["result"];
                        
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
                              CIHistory[i]["onTargetSanity"] = 'DAT sys error ' + datExitCodes[index]
                              break                          
                        }
    
                        
                        if (doc["number"] > CILastSanityBuildID) {
                            CILastSanityBuildID = doc["number"];
                        }
                    }
                    break;
                }
            }
        });
        extRegressionDocs.forEach(function(doc) {
            var rlsTag = findParamValue(doc, "NEW_BASELINE");

            for (var i = CIHistory.length-1; i >= 0; --i) {
                if (rlsTag && CIHistory[i]["rlsTag"] == rlsTag) {
                    if (!CIHistory[i]["extRegression"]){
                        CIHistory[i]["extRegression"] = doc["result"];
                        if (doc["number"] > CILastExtRegressionBuildID) {
                            CILastExtRegressionBuildID = doc["number"];
                        }
                    }
                    break;
                }
            }
        });
        memoryLeakDocs.forEach(function(doc) {
            var rlsTag = findParamValue(doc, "NEW_BASELINE");

            for (var i = CIHistory.length-1; i >= 0; --i) {
                if (rlsTag && CIHistory[i]["rlsTag"] == rlsTag) {
                    if (!CIHistory[i]["memoryLeak"]) {
                        CIHistory[i]["memoryLeak"] = doc["result"];
                        if (doc["number"] > CIMemoryLeakBuildID) {
                            CIMemoryLeakBuildID = doc["number"];
                        }
                    }
                    break;
                }
            }
        });
    }).run();

    server.close();
}

updateCIHistoryInfo();
setInterval(function(){
    onTargertTestInfo('PCR-REPT-DAT_LATEST');
    updateLatestBuildInfo('PCR-REPT-0-MultiJob');    

}, GET_JENKINS_INTERVAL);

setInterval(function() {
    updateCIHistoryInfo();
}, CI_HISTORY_INTERVAL);


/* GET feedback about git page. */
router.get('/getCIStatus', function(req, res, next) {

  console.log("getCIStatus"); 

  return res.json(CISTATUS);      
});

router.get('/getCIPendingReq', function(req, res, next){
    console.log("getCIPendingReq");
    getPendingReq("REPT2.7", function(err, data){
        if (err) { return res.end(); }
        data.current.submitter = CISTATUS.overall.current.submitter;
        data.current.subTime = CISTATUS.overall.current.subTime;
        data.current.subBranch = CISTATUS.overall.current.subBranch;   
        return res.json(data);
    });
});


router.get('/dashboard', function(req, res, next){
    res.render('CIDashboard',{ title: 'CI DashBoard' });
})

router.get('/getOnTargetBuild', function(req, res, next){
  getJobDuration('PCR-REPT-On_Target_Build_MultiJob',days,function(err,data){
    return res.json(data);
  });
})

router.get('/getOnTargetTest', function(req, res, next){
  getJobDuration('PCR-REPT-DAT_LATEST',days,function(err,data){
    return res.json(data);
  });
})

router.get('/getOffTargetBuild', function(req, res, next){
  getJobDuration('PCR-REPT-Off_Target_Build_MultiJob',days,function(err,data){
    return res.json(data);
  });
})

router.get('/getOffTargetTest', function(req, res, next){
  getJobDuration('PCR-REPT-Off_Target_Test_MultiJob',days,function(err,data){
    return res.json(data);
  });
})

router.get('/getTheWholeCI', function(req, res, next){
  getJobDuration('PCR-REPT-0-MultiJob',days,function(err,data){
    return res.json(data);
  });
})


router.get('/getFailInfo', function(req, res, next){
  getJobFailureInfo('PCR-REPT-0-MultiJob',days,function(err,data){
    return res.json(data);
  });
})

router.get('/getCIHistory', function(req, res, next){
    return res.json(CIHistory);
})
router.get('/ControlPanel', function(req, res, next){
    res.render('controlPanel',{ title: 'unblock CI' });
})
router.post('/doUnblockCI', function(req, res, next) {
    console.log("/doUnblockCI")
    var jenkinsci = req.body.jenkinsCI;
    var boosterdisplay = req.body.boosterdisplay;
    var password = req.body.password;

    passwordVerify("unblock",password,function(result){
        if (result){
            status = ciUnblock(jenkinsci,boosterdisplay)
        }
        else{
            status = "Invalid password"
        }
        res.send(status)
        return false;
    })
})
  

module.exports = router;
