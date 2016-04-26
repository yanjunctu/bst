var express = require('express');
var router = express.Router();
var jenkins = require('../models/jenkins.js');
var fs = require('fs');
var xlsjs = require('xlsjs');
var cnt=0;
var GET_JENKINS_INTERVAL = 15000; // 15seconds
var days=30;

var emeraldStatus = {
  "idleState":{"status":"running","duration":0},
  "preCheckState":{"status":"not start","duration":2},
  "buildFwState":{"status":"not start","duration":3},
  "testFwState":{"status":"not start","duration":4},
  "buildWin32State":{"status":"not start","duration":5},
  "testWin32State":{"status":"not start","duration":0},
  "preReleaseState":{"status":"not start","duration":0},
  "overall":{"current":{"branch":"na","subTime":"na"}}
};  

var nonEmeraldStatus = {
  "idleState":{"status":"running","duration":0},
  "preCheckState":{"status":"not start","duration":2},
  "buildFwState":{"status":"not start","duration":3},
  "testFwState":{"status":"not start","duration":4},
  "buildWin32State":{"status":"not start","duration":5},
  "testWin32State":{"status":"not start","duration":0},
  "preReleaseState":{"status":"not start","duration":0},
  "overall":{"current":{"branch":"na","subTime":"na"}}
};  

// Variables for CI history info
const CI_INFO_FILE = "/var/opt/booster/jenkins.xls";
const CI_TRIGGER_SHEET = "emerald_multiJob";
const CI_ON_TARGET_SHEET = "onTarget_multiJob";
const CI_ON_TAEGET_BUILD_SHEET = "onTarget_build_multiJob";
const CI_OFF_TARGET_SHEET = "offTarget_multi_job";
const CI_OFF_TARGET_BUILD_SHEET = "offTarget_build_job";
const CI_OFF_TARGET_TEST_SHEET = "offTarget_test_multiJob";
const CI_OFF_TARGET_UT_SHEET = "offTarget_test_ut_job";
const CI_OFF_TARGET_IT_SHEET = "offTarget_test_it_job";
var CIFileMTime = 0;
var CIHistory = [];
var CIOnTargetAllJobs = {"multiJob": [], "build": []};
var CIOffTargetAllJobs = {"multiJob": [], "build": [], "test": [], "win32UT": [], "win32IT": []};

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

function getProjectName(data){
  var actions = data.actions;
  var found;
  
  actions.forEach(function(action){
    if (action.hasOwnProperty("parameters")) {
      var paras = action.parameters;
      paras.forEach(function(para){
        //console.log(para.name);
        if(para.name=="PROJECT_NAME"){
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

function getBranchName(data){
  
  var actions = data.actions;
  var found;
  
  actions.forEach(function(action){
    if (action.hasOwnProperty("parameters")) {
      var paras = action.parameters;
      paras.forEach(function(para){
        //console.log(para.name);
        if(para.name=="IR_BRANCH"){
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


function getSubmitterName(data){
  
  var actions = data.actions;
  var found;
  
  actions.forEach(function(action){
    if (action.hasOwnProperty("parameters")) {
      var paras = action.parameters;
      paras.forEach(function(para){
        //console.log(para.name);
        if(para.name=="SUBMITTER"){
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
    var result = {"current":{"submitter":"","subTime":0},"queue":[]};

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
                        if(keyValue[0] == 'PUSH_TIME')
                        {
                            pushTime = keyValue[1];
                        }
                   
                    });
                    
                    if(projName == project){
                        var jobName = /pcr-rept-0-multijob(-emerald)?/ig.exec(item.task.name);
                        if (jobName && submitter && pushTime){
                     
                            console.log('jobname:'+item.task.name);
                                        console.log(submitter,pushTime);
                            result.queue.push({"submitter":submitter, "subTime":pushTime});
                        }     
                    }
                    /*
                    var projName = /PROJECT_NAME=(.*)[&]/ig.exec(item.params);
                    var submitter = /SUBMITTER=(.*)/ig.exec(item.params);
                    var pushTime = /PUSH_TIME=(.*)/ig.exec(item.params);
                    var jobName = /pcr-rept-0-multijob(-emerald)?/ig.exec(item.task.name);

                    if (projName && jobName && submitter && pushTime){
                        result.queue.push({"submitter":submitter[1], "subTime":pushTime[1]});
                    }
                    */
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
    ciStatus.overall.current.branch="na";
    ciStatus.overall.current.subTime="na";
	
	  
	  
    if (data.building==false){
      //return res.json(ciStatus);
      ciStatus.idleState.status="running";
    }else {
      ciStatus.idleState.status="done";
      ciStatus.overall.current.branch= getSubmitterName(data);//data.actions[0].parameters[1].value;
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

submitter.push(getSubmitterName(data)); 

}

function getJobDuration(job,days,callback){

	var oldestTimeStamp = (Math.round(new Date().getTime()))-(days * 24 * 60 * 60 * 1000);
	var emerStr ="REPT2.7_Emerald";
	var durationDic = {"id_em":[],"duration_em":[],"submitter_em":[],"timestamp_em":[],"id_non":[],"duration_non":[],"submitter_non":[],"timestamp_non":[]};
	
	
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
		   if(data[i].result == "SUCCESS")
		   {
		       //parameter=data[i].actions[0].parameters;
			   if(getProjectName(data[i]) == emerStr)
			   {
			       pushdata(durationDic.id_em,durationDic.duration_em,durationDic.submitter_em,durationDic.timestamp_em,data[i]);
			   
			   }
			   else
			   {
                   pushdata(durationDic.id_non,durationDic.duration_non,durationDic.submitter_non,durationDic.timestamp_non,data[i]); 
               }
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

				failureInfoDic.failSubmitter.push(getSubmitterName(data[i])); 
   
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

var updateLatestBuildInfo = function(job){
    
    getJobLastBuild(job,function(err,data){
        if(err) 
        {
          console.log("err in getJobLastBuild");
          return;
        }
    
        var project = getProjectName(data);//data.actions[0].parameters[0].value;
        var ciStatus;
        if (project=="REPT2.7_Emerald"){
          ciStatus = emeraldStatus;      
        }else{
          ciStatus = nonEmeraldStatus;
        }
        updateStatus(ciStatus,data);  
        });
}

var getObjByElement = function(objs, key, value) {
    var i = objs.length - 1;

    if (!value) {
        return;
    }
    while (i >= 0) {
        if (objs[i][key] == value) {
            return objs[i];
        }
        --i;
    }

    return;
}

var getBuildStatus = function(jobs, jobID, type) {
    var res = "na";
    var multiJob = jobs["multiJob"];
    var target = "PCR-REPT-On_Target_Build_MultiJob";

    if ("off-target" == type) {
        target = "PCR-REPT-Off_Target_Build_MultiJob";
    } var targetJobInfo = getObjByElement(multiJob, "build id", jobID);
    if (targetJobInfo) {
        var buildJob = jobs["build"];
        var targetBuildInfo = getObjByElement(buildJob, "build id", targetJobInfo[target]);

        if (targetBuildInfo) {
            res = targetBuildInfo["build result"];
        }
    }

    return res;
}

var getTestStatus = function(jobs, jobID, type) {
    var res = {"UT": "", "IT": ""};
    var target = "PCR-REPT-On_Target_Test_MultiJob";
    var ut = "", it = "";

    // For now, only off target is supported
    if ("off-target" == type) {
        target = "PCR-REPT-Off_Target_Test_MultiJob";
        ut = "PCR-REPT-Win32_UT";
        it = "PCR-REPT-Win32_IT";
    }

    var targetJobInfo = getObjByElement(jobs["multiJob"], "build id", jobID);
    if (targetJobInfo) {
        var targetTestInfo = getObjByElement(jobs["test"], "build id", targetJobInfo[target]);

        if (targetTestInfo) {
            var utInfo = getObjByElement(jobs["win32UT"], "build id", targetTestInfo[ut]);
            var itInfo = getObjByElement(jobs["win32IT"], "build id", targetTestInfo[it]);

            if (utInfo) {
                res["UT"] = utInfo["build result"];
            }
            if (itInfo) {
                res["IT"] = itInfo["build result"];
            }
        }
    }

    return res;
}

var refreshCIJobs = function(workbook) {
    CIOnTargetAllJobs["multiJob"] = xlsjs.utils.sheet_to_json(workbook.Sheets[CI_ON_TARGET_SHEET]);
    CIOnTargetAllJobs["build"] = xlsjs.utils.sheet_to_json(workbook.Sheets[CI_ON_TAEGET_BUILD_SHEET]);
    CIOffTargetAllJobs["multiJob"] = xlsjs.utils.sheet_to_json(workbook.Sheets[CI_OFF_TARGET_SHEET]);
    CIOffTargetAllJobs["build"] = xlsjs.utils.sheet_to_json(workbook.Sheets[CI_OFF_TARGET_BUILD_SHEET]);
    CIOffTargetAllJobs["test"] = xlsjs.utils.sheet_to_json(workbook.Sheets[CI_OFF_TARGET_TEST_SHEET]);
    CIOffTargetAllJobs["win32UT"] = xlsjs.utils.sheet_to_json(workbook.Sheets[CI_OFF_TARGET_UT_SHEET]);
    CIOffTargetAllJobs["win32IT"] = xlsjs.utils.sheet_to_json(workbook.Sheets[CI_OFF_TARGET_IT_SHEET]);
}

var refreshCIHistory = function(workbook) {
    var triggerSheet = workbook.Sheets[CI_TRIGGER_SHEET];

    // Each CI job begins with a trigger job
    if (triggerSheet) {
        var allTriggerJobs = xlsjs.utils.sheet_to_json(triggerSheet);
        var start = allTriggerJobs.length;
        var lastBuildID = 0;

        // Find the new trigger jobs since the last update
        if (CIHistory.length > 0) {
            lastBuildID = CIHistory[CIHistory.length-1]["buildID"];
        }
        while(start>0 && allTriggerJobs[start-1]["build id"]>lastBuildID) {
            --start;
        }
        if (start == allTriggerJobs.length) {
            return;
        }

        // Delta refresh CI History with the new CI trigger jobs
        refreshCIJobs(workbook);
        while (start < allTriggerJobs.length) {
            var newTriggerJob = allTriggerJobs[start++];
            var onTargetJobID = newTriggerJob["PCR-REPT-On_Target_MultiJob"];
            var offTargetJobID = newTriggerJob["PCR-REPT-Off_Target_MultiJob"];
            var startTime = newTriggerJob["start time"];
            var duration = newTriggerJob["build duration"];
            var buildResult = newTriggerJob["build result"];
            var entry = {"buildResult": "", "buildID": 0, "submitter": "", "rlsTime": "", "onTargetBuild": "","offTargetBuild": "", "win32UT": "", "win32IT": "", "codeStaticCheck": "", "onTargetSanity": "", "extRegressionTest": ""};

            entry["buildID"] = newTriggerJob["build id"];
            entry["buildResult"] = newTriggerJob["build result"];
            if (newTriggerJob["submitter"]) {
                entry["submitter"] = newTriggerJob["submitter"];
            }
            if (startTime && duration && entry["buildResult"] == "SUCCESS") {
                var tmp = duration.split(':');
                var durationMs = (parseInt(tmp[0])*3600+parseInt(tmp[1])*60+parseInt(tmp[2]))*1000;
                var rlsTime = (new Date(startTime)).getTime() + durationMs;
                var d = new Date(rlsTime);

                entry["rlsTime"] = d.toLocaleDateString() + " " + d.toLocaleTimeString();
            }
            if (onTargetJobID) {
                entry["onTargetBuild"] = getBuildStatus(CIOnTargetAllJobs, onTargetJobID, "on-target");
            }
            if (offTargetJobID) {
                var testStatus = getTestStatus(CIOffTargetAllJobs, offTargetJobID, "off-target");

                entry["offTargetBuild"] = getBuildStatus(CIOffTargetAllJobs, offTargetJobID, "off-target");
                entry["win32UT"] = testStatus["UT"];
                entry["win32IT"] = testStatus["IT"];
            }
            CIHistory.push(entry);
        }
    }
}

var updateCIHistoryInfo = function() {
    fs.stat(CI_INFO_FILE, function(err, stats) {
        if (err) {
            console.log(err);
            return;
        }
        var newMTime = new Date(stats.mtime).getTime();
        if (newMTime != CIFileMTime) {
            var workbook = xlsjs.readFile(CI_INFO_FILE);

            if (workbook) {
                refreshCIHistory(workbook);
                CIFileMTime = newMTime;
            } 
        }
    });
}

setInterval(function(){
    
    updateLatestBuildInfo('PCR-REPT-0-MultiJob-Emerald');
    updateLatestBuildInfo('PCR-REPT-0-MultiJob');    
    updateCIHistoryInfo();

},GET_JENKINS_INTERVAL);


/* GET feedback about git page. */
router.get('/getEmerStatus', function(req, res, next) {

  console.log("getEmerStatus"); 

  return res.json(emeraldStatus);      
});

router.get('/getEmerPendingReq', function(req, res, next){
    console.log("getEmerPendingReq");
    getPendingReq("REPT2.7_Emerald", function(err, data){
        if (err) { return res.end(); }
        data.current.submitter = emeraldStatus.overall.current.branch;
        data.current.subTime = emeraldStatus.overall.current.subTime;
        return res.json(data);
    });
});
  
router.get('/getNonEmerStatus', function(req, res, next) {

  console.log("getNonEmerStatus");

  return res.json(nonEmeraldStatus);       
});

router.get('/getNonEmerPendingReq', function(req, res, next){
    console.log("getnonEmerPendingReq");
    getPendingReq("REPT2.7", function(err, data){
        if (err) { return res.end(); }
        data.current.submitter = nonEmeraldStatus.overall.current.branch;
        data.current.subTime = nonEmeraldStatus.overall.current.subTime;
        return res.json(data);
    });
})

router.get('/dashboard', function(req, res, next){
    res.render('CIDashboard',{ title: 'CI DashBoard' });
})

router.get('/getOnTargetBuild', function(req, res, next){
  getJobDuration('PCR-REPT-On_Target_Build_MultiJob',days,function(err,data){
    return res.json(data);
  });
})

router.get('/getOnTargetTest', function(req, res, next){
  getJobDuration('PCR-REPT-DAT_REAL',days,function(err,data){
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

router.get('/getTheWholeCI_emerald', function(req, res, next){
  getJobDuration('PCR-REPT-0-MultiJob-Emerald',days,function(err,data){
    return res.json(data);
  });
})

router.get('/getTheWholeCI_nonemerald', function(req, res, next){
  getJobDuration('PCR-REPT-0-MultiJob',days,function(err,data){
    return res.json(data);
  });
})

router.get('/getEmeraldFailInfo', function(req, res, next){
  getJobFailureInfo('PCR-REPT-0-MultiJob-Emerald',days,function(err,data){
    return res.json(data);
  });
})

router.get('/getNonEmeraldFailInfo', function(req, res, next){
  getJobFailureInfo('PCR-REPT-0-MultiJob',days,function(err,data){
    return res.json(data);
  });
})

router.get('/getCIHistory', function(req, res, next){
        return res.json(CIHistory);
})

module.exports = router;
