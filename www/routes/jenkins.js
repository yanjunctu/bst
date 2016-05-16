var express = require('express');
var router = express.Router();
var jenkins = require('../models/jenkins.js');
var fiber = require('fibers');
var server = require('mongo-sync').Server;
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
  "ciBlockInfo":{"result":"na","submitter":"na","releaseTag":"na",lastSuccessTag:"na"},
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
  "ciBlockInfo":{"result":"SUCCESS","submitter":"na","releaseTag":"na",lastSuccessTag:"na"},
  "overall":{"current":{"branch":"na","subTime":"na"}}
};  

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
                    console.log(item);
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
      ciStatus.overall.current.branch= getParameterValue(data,"SUBMITTER");//data.actions[0].parameters[1].value;
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
			   if(getParameterValue(data[i],"PROJECT_NAME") == emerStr)
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

        updateOnTargetTestStatus(nonEmeraldStatus.ciBlockInfo,data,job);  
    });
}


var updateLatestBuildInfo = function(job){
    
    getJobLastBuild(job,function(err,data){
        if(err) 
        {
          console.log("err in getJobLastBuild");
          return;
        }
    
        var project = getParameterValue(data,"PROJECT_NAME");//data.actions[0].parameters[0].value;
        var ciStatus;
        if (project=="REPT2.7_Emerald"){
          ciStatus = emeraldStatus;
        }else{
          ciStatus = nonEmeraldStatus;
        }
        updateStatus(ciStatus,data); 
        console.log(project)
        console.log(ciStatus)
       
        });
}

setInterval(function(){
    onTargertTestInfo('PCR-REPT-DAT_LATEST');
    updateLatestBuildInfo('PCR-REPT-0-MultiJob-Emerald');
    updateLatestBuildInfo('PCR-REPT-0-MultiJob');    

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


module.exports = router;
