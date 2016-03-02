var express = require('express');
var router = express.Router();
var jenkins = require('../models/jenkins.js');
var cnt=0;
var GET_JENKINS_INTERVAL = 5000; // 15seconds
var days=7;

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
    data = tempdata.allBuilds;
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

    jenkins.queue(function(err, data){
        var items = data.items;
        var prjName = "PROJECT_NAME=".concat(project);

        if (err) {
            callback(err);
            return;
        }
        items.forEach(function(item){
            if ((item.blocked || item.stuck) && item.params.indexOf(prjName) > -1){
                var sub = /SUBMITTER=(.*)/ig.exec(item.params);

                //console.log(item);
                //console.log("project");
                //console.log(prjName);
                if (sub){
                    result.queue.push({"submitter":sub[1], "subTime":item.inQueueSince});
                }
            }
        });
        callback(null, result);
    });
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
function pushdata(id,duration,submitter,timestamp,parameter,data){



	duration.push(data.duration/(60000)); //convert to minute

	id.push(data.id);
	//durationDic.timestamp.push(data[i].timestamp);
	timestamp.push(data.timestamp);
	//get submitter name
	//parameter=data.actions[0].parameters;
	//console.log(parameters);
	for(var j = 0;j<parameter.length; j++)
	{
		if(parameter[j].name == "SUBMITTER")
		{
			submitter.push(parameter[j].value); 
		}
	}
}
function getJobDuration(job,days,callback){

	var oldestTimeStamp = (Math.round(new Date().getTime()))-(days * 24 * 60 * 60 * 1000);
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
		       parameter=data[i].actions[0].parameters;
			   if(parameter[0].value == "REPT2.7_nonEmerald")
			   {
			       pushdata(durationDic.id_non,durationDic.duration_non,durationDic.submitter_non,durationDic.timestamp_non,parameter,data[i]);
			   }
			   else
			   {
			       pushdata(durationDic.id_em,durationDic.duration_em,durationDic.submitter_em,durationDic.timestamp_em,parameter,data[i]);
				   console.log(parameter[0].value);
			       console.log(durationDic);
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
			   parameters=data[i].actions[0].parameters;
			   if(parameters != undefined)
			   {
					for(var j = 0;j<parameters.length; j++)
					{
						if(parameters[j].name == "SUBMITTER")
						{
							failureInfoDic.failSubmitter.push(parameters[j].value); 
						}
					}
				}			   
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
        if (project=="REPT2.7_nonEmerald"){
          ciStatus = nonEmeraldStatus;      
        }else{
          ciStatus = emeraldStatus;
        }
        updateStatus(ciStatus,data);  
        });
}

setInterval(function(){
    
    updateLatestBuildInfo('PCR-REPT-0-MultiJob-Emerald');
    updateLatestBuildInfo('PCR-REPT-0-MultiJob-nonEmerald');    

},GET_JENKINS_INTERVAL);


/* GET feedback about git page. */
router.get('/getEmerStatus', function(req, res, next) {

  console.log("getEmerStatus"); 

  return res.json(emeraldStatus);      
});

router.get('/getEmerPendingReq', function(req, res, next){
    console.log("getEmerPendingReq");
    getPendingReq("REPT2.7_Emerald", function(err, data){
        if (err) { return res.end(err); }
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
    getPendingReq("REPT2.7_nonEmerald", function(err, data){
        if (err) { return res.end(err); }
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
  getJobDuration('PCR-REPT-0-MultiJob-nonEmerald',days,function(err,data){
    return res.json(data);
  });
})

router.get('/getEmeraldFailInfo', function(req, res, next){
  getJobFailureInfo('PCR-REPT-0-MultiJob-Emerald',days,function(err,data){
    return res.json(data);
  });
})

router.get('/getNonEmeraldFailInfo', function(req, res, next){
  getJobFailureInfo('PCR-REPT-0-MultiJob-nonEmerald',days,function(err,data){
    return res.json(data);
  });
})

module.exports = router;
