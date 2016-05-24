var express = require('express');
var router = express.Router();
var jenkins = require('../models/jenkins.js');
var fiber = require('fibers');
var server = require('mongo-sync').Server;
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
  "ciBlockInfo":{"result":"SUCCESS","submitter":"na","releaseTag":"na",lastSuccessTag:"na"}
};  

// Variables for CI history info
const CI_TRIGGER_JOB= "PCR-REPT-0-MultiJob";
const CI_ON_TARGET_JOB= "PCR-REPT-On_Target_MultiJob";
const CI_ON_TAEGET_BUILD_JOB= "PCR-REPT-On_Target_Build_MultiJob";
const CI_OFF_TARGET_JOB= "PCR-REPT-Off_Target_MultiJob";
const CI_OFF_TARGET_BUILD_JOB= "PCR-REPT-Off_Target_Build_MultiJob";
const CI_OFF_TARGET_TEST_JOB= "PCR-REPT-Off_Target_Test_MultiJob";
const CI_OFF_TARGET_UT_JOB= "PCR-REPT-Win32_UT";
const CI_OFF_TARGET_IT_PART1_JOB = "PCR-REPT-Win32_IT-TEST-Part1";
const CI_OFF_TARGET_IT_PART2_JOB = "PCR-REPT-Win32_IT-TEST-Part2";
const CI_COVERAGE_CHECK_JOB = "PCR-REPT-Win32_COV_CHECK";
const CI_RELEASE_JOB = "PCR-REPT-Git-Release";
const CI_SANITY_TEST_JOB = "PCR-REPT-DAT_LATEST";
const CI_EXT_REGRESSION_JOB = "PCR-REPT-DAT_DAILY";
const CI_WARNING_COLL_NAME = "warningKlocwork";
var CIHistory = [];
var CIOnTargetBuildChain = [CI_ON_TARGET_JOB, CI_ON_TAEGET_BUILD_JOB];
var CIOffTargetBuildChain = [CI_OFF_TARGET_JOB, CI_OFF_TARGET_BUILD_JOB];
var CIOffTargetTestChain = [CI_OFF_TARGET_JOB, CI_OFF_TARGET_TEST_JOB];

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
          return;
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
                   
                    });
                    
                    if(projName == project){
                        var jobName = /pcr-rept-0-multijob/ig.exec(item.task.name);
                        if (jobName && submitter && branch && pushTime){
                     
                            console.log('jobname:'+item.task.name);
                                        console.log(submitter,branch,pushTime);
                            result.queue.push({"id": id,"submitter":submitter,"subBranch":branch,"subTime":pushTime});
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
var updateOnTargetTestStatus = function(ciBlockInfo,data,job){
    
    ciBlockInfo.result = data.result;
    ciBlockInfo.releaseTag=getParameterValue(data,"NEW_BASELINE");
    ciBlockInfo.submitter="";
    ciBlockInfo.lastSuccessTag=""
    //ciBlockInfo.submitter=getParameterValue(data,"SUBMITTER");
    if (ciBlockInfo.result == "FAILURE"){
        getJobLastSuccessBuild(job,function(err,data){
            if(err) {
                console.log("err in onTargertTestInfo");
                return;
            }
            ciBlockInfo.lastSuccessTag=getParameterValue(data,"NEW_BASELINE");

            fiber(function() {

                var db = new server("127.0.0.1").db("booster");
                var docS = db.getCollection('PCR-REPT-Git-Release').find({"release tag": {$eq:ciBlockInfo.lastSuccessTag}}).toArray();
                sucessId = docS[0]["build id"];
                var docF = db.getCollection('PCR-REPT-Git-Release').find({"release tag": {$eq:ciBlockInfo.releaseTag}}).toArray();
                failId = docF[0]["build id"];

                var docs = db.getCollection('PCR-REPT-Git-Release').find({"build id": {$gt:sucessId,$lte:failId}}).toArray();

                var submitter = ""
                docs.forEach(function(doc) {

                   if(doc["project name"] == "REPT2.7"){
                       submitter = submitter + doc["submitter"]+";";
                   }
                   
                });
                ciBlockInfo.submitter=submitter;
            }).run();
            
        });
        // Cancle all pending CI requests
        getPendingReq("REPT2.7", function(err, data){
            if (err) {
                console.log(err);
                return;
            }
            // Cancle all pending CI reqs
            data["queue"].forEach(function(pendingCI) {
                var id = pendingCI["id"];

                jenkins.cancel_item(id, function(err) {
                    if (err) {
                        console.log("failed to cancel item["+id.toString()+"]"+err);
                    }
                    else {
                        console.log("succeeded to cancel item["+id.toString()+"]"+err);
                    }
                });
            });
        });
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

var getBuildInfoByBuildChain = function(db, doc, buildChain) {
    var i = 0;
    var buildInfo = doc;
    
    if (!db || !doc || !buildChain || 0 == buildChain.length) {
        return;
    }
    for (; i < buildChain.length && buildInfo && buildChain[i] in buildInfo; ++i) {
        var nextBuildColl = db.getCollection(buildChain[i]);
        var nextBuildID = buildInfo[buildChain[i]];

        if (!nextBuildColl || !nextBuildID) {
            break;
        }
        buildInfo = nextBuildColl.findOne({"build id": nextBuildID});
    }
    if (i == buildChain.length) {
        return buildInfo;
    }

    return;
}

var refreshCIHistory = function(db, doc) {
    var entry = {};
    var rlsDate = new Date(doc["start time"] + doc["build duration"]);
    var rlsInfo = db.getCollection(CI_RELEASE_JOB).findOne({"build id": doc[CI_RELEASE_JOB]});
    var itValue = {};
    
    entry["buildID"] = doc["build id"];
    entry["buildResult"] = doc["build result"];
    entry["submitter"] = doc["submitter"];
    // Release time/release tag/code static check/sanity test/extended regression test
    if (entry["buildResult"] == "SUCCESS") {
        entry["rlsTime"] = rlsDate.toLocaleDateString() + " " + rlsDate.toLocaleTimeString();
        if (rlsInfo && "release tag" in rlsInfo) {
            var buildWarnings = 0, klocworkWarnings = 0;
            var rlsTag = rlsInfo["release tag"];
            // Different key name of the release tag field in different collections
            var warnings = db.getCollection(CI_WARNING_COLL_NAME).find({"releaseTag": rlsTag}).toArray();
            // Maybe the same release version will be tested many times, we only care the last one
            var onTargetSanity = db.getCollection(CI_SANITY_TEST_JOB).find({"release tag": rlsTag}).sort({"build id": -1}).toArray();
            var extRegression = db.getCollection(CI_EXT_REGRESSION_JOB).find({"release tag": rlsTag}).sort({"build id": -1}).toArray();

            entry["rlsTag"] = rlsInfo["release tag"];
            for (var i = 0; i < warnings.length; ++i) {
                buildWarnings += warnings["buildWarningCnt"];
                klocworkWarnings += warnings["klocworkCnt"];
            }
            entry["codeStaticCheck"] = {"build": buildWarnings, "klocwork": klocworkWarnings};
            if (0 != onTargetSanity.length) {
                entry["onTargetSanity"] = onTargetSanity[0]["build result"];
            }
            if (0 != extRegression) {
                entry["extRegression"] = extRegression[0]["build result"];
            }
        }
    }
    // Get on-target build result 
    var buildInfo = getBuildInfoByBuildChain(db, doc, CIOnTargetBuildChain);
    if (buildInfo && "build result" in buildInfo) 
        entry["onTargetBuild"] = buildInfo["build result"];

    // Get off-target build result
    buildInfo = getBuildInfoByBuildChain(db, doc, CIOffTargetBuildChain);
    if (buildInfo && "build result" in buildInfo)
        entry["offTargetBuild"] = buildInfo["build result"];

    // Get off-target ut, it and coverage result 
    buildInfo = getBuildInfoByBuildChain(db, doc, CIOffTargetTestChain);
    if (buildInfo) {
        var jobsMap = {
                "win32UT": CI_OFF_TARGET_UT_JOB,
                "win32ITPart1": CI_OFF_TARGET_IT_PART1_JOB,
                "win32ITPart2": CI_OFF_TARGET_IT_PART2_JOB,
                "coverage": CI_COVERAGE_CHECK_JOB
        };
        var tmpInfo = {};
        
        // Build id of ut, it and coverage can be found in build info of off-target test job if any
        for (var key in jobsMap) {
            var jobName = jobsMap[key];
            
            if (!(jobName in buildInfo)) {
                continue;
            }
            var id = buildInfo[jobName];
            var info = db.getCollection(jobName).findOne({"build id": id});

            if (info) {
                if (key == "coverage")
                    tmpInfo[key] = info["coverage"];
                else
                    tmpInfo[key] = info["build result"];
            }
        }
        entry["win32UT"] = tmpInfo["win32UT"];
        if (tmpInfo["win32ITPart1"] || tmpInfo["win32ITPart2"]) {
            entry["win32IT"] = {};
            if (tmpInfo["win32ITPart1"])
                entry["win32IT"]["win32ITPart1"] = tmpInfo["win32ITPart1"];
            if (tmpInfo["win32ITPart2"])
                entry["win32IT"]["win32ITPart2"] = tmpInfo["win32ITPart2"];
        }
        entry["coverage"] = tmpInfo["coverage"];
    }

    CIHistory.push(entry);
}

var updateCIHistoryInfo = function() {
    var lastBuildID = 0;

    // find the new trigger builds since the last update
    if (CIHistory.length > 0) {
        lastBuildID = CIHistory[CIHistory.length-1]["buildID"];
    }
    
    fiber(function() {
        var db = new server("127.0.0.1").db("booster");
        var docs = db.getCollection(CI_TRIGGER_JOB).find({"build id": {$gt: lastBuildID}}).toArray();
         
        docs.forEach(function(doc) {
            refreshCIHistory(db, doc);
        });
    }).run();
}

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
    if (0 == CIHistory.length) {
        updateCIHistoryInfo();
    }

    return res.json(CIHistory);
})


module.exports = router;
