var express = require('express');
var router = express.Router();
var jenkins = require('../models/jenkins.js');
var cnt=0;
var GET_JENKINS_INTERVAL = 5000; // 15seconds

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
	//console.log(data);
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
        //console.log(data);
        items.forEach(function(item){
            if ((item.blocked || item.stuck) && item.params.indexOf(prjName) > -1){
                var sub = /SUBMITTER=(.*)/ig.exec(item.params);

                console.log(item);
                console.log("project");
                console.log(prjName);
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
	
    getJobFailureInfo('PCR-REPT-0-MultiJob-Emerald',7,function(err,data){
    if(err) 
    {
      console.log("err in getJobDuration");
      return;
    }
	});
	  
	  
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
            console.log("preCheckState running");
          }
          else if(element.result=="SUCCESS"){
            ciStatus.preCheckState.status = "done";
            console.log("preCheckState done");            
          }
        } else if(element.jobName =='PCR-REPT-Git-Release'){
          if (element.result==null){
            ciStatus.preReleaseState.status = "running";
            console.log("preReleaseState running");            
          }
          else if(element.result=="SUCCESS"){
            ciStatus.preReleaseState.status = "done";
            console.log("preReleaseState done");               
          }
        } else if(element.jobName =='PCR-REPT-On_Target_MultiJob'){
          if (element.result=="SUCCESS"){
            ciStatus.buildFwState.status = "done";
            ciStatus.testFwState.status = "done";            
            console.log("On Target all done");               
          }
          else if(element.result==null){
              getJobBuild('PCR-REPT-On_Target_MultiJob',element.buildNumber,function(err,data){
              if(err) 
              {
                console.log("err in subBuilds ON target ")
                return;
              }
              
              data.subBuilds.forEach(function(element, index, array){
                if(element.jobName =='PCR-REPT-On_Target_Build_MultiJob'){
                  if (element.result==null){
                    ciStatus.buildFwState.status = "running";
                    console.log("buildFwState running");                       
                  }
                  else if(element.result=="SUCCESS"){
                    ciStatus.buildFwState.status = "done";
                    console.log("buildFwState done");                      
                  }
                } else if(element.jobName =='PCR-REPT-On_Target_Test_MultiJob'){
                  if (element.result==null){
                    ciStatus.testFwState.status = "running";
                    console.log("testFwState running");                      
                  }
                  else if(element.result=="SUCCESS"){
                    ciStatus.testFwState.status = "done";
                    console.log("testFwState done");                         
                  }
                } 
              });
          });
          }
        } else if(element.jobName =='PCR-REPT-Off_Target_MultiJob'){
          if (element.result=="SUCCESS"){
            ciStatus.buildWin32State.status = "done";
            ciStatus.testWin32State.status = "done";   
            console.log("Off target all done"); 
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

function getJobDuration(job,days,callback){

	var oldestTimeStamp = (Math.round(new Date().getTime()))-(days * 24 * 60 * 60 * 1000);
	var durationDic = new Array();
	durationDic['id'] = new Array();
	durationDic['duration'] = new Array();
	durationDic['submitter'] = new Array();
	durationDic['timestamp'] = new Array();
	var parameters;
	var param = 'id,duration,result,timestamp,actions[parameters[*]]'
	
    getAllBuild(job,param,function(err,data){
    if(err) 
    {
      console.log("err in getJobDuration");
      return;
    }
	//console.log(data);
	for (var i = 0; i < data.length; i++) 
	{
	    if(data[i].timestamp > oldestTimeStamp)
		{
		   if(data[i].result == "SUCCESS")
		   {
		       console.log("test");
			   durationDic.duration.push(data[i].duration);
		       durationDic.id.push(data[i].id);
			   durationDic.timestamp.push(data[i].timestamp);
			   //get submitter name
			   parameters=data[i].actions[0].parameters;
			   //console.log(parameters);
			   for(var j = 0;j<parameters.length; j++)
			   {
			        if(parameters[j].name == "SUBMITTER")
					{
					    durationDic.submitter.push(parameters[j].value); 
					}
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
    //var param = "subBuilds[*]"
	var subBuilds;
	var parameters;
    var failureInfoDic=new Array();
	failureInfoDic['allBuildNumber'] =0;
	failureInfoDic['failureNumber'] =0;
	failureInfoDic['abortedNumber'] =0;
	failureInfoDic['failBuildName'] =new Array('Pre',0,0,0,0,0,0,0);
	failureInfoDic['failBuildNum'] =new Array(0,0,0,0,0,0,0,0);
	failureInfoDic['failSubmitter'] =new Array();
	failureInfoDic['failTimeStamp'] =new Array();
	
    getAllBuild(job,param,function(err,data){
    if(err) 
    {
      console.log("err in getJobFailureInfo");
      return;
    }
    console.log(data);
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
							failureInfoDic.failBuildName[sub+1]=subBuilds.jobName;
							failureInfoDic.failBuildNum[sub+1]++
							console.log(subBuilds[sub+1]);
						}
					}
			   }
			   parameters=data[i].actions[0].parameters;
			   for(var j = 0;j<parameters.length; j++)
			   {
			        if(parameters[j].name == "SUBMITTER")
					{
					    failureInfoDic.failSubmitter.push(parameters[j].value); 
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
		    console.log(failureInfoDic);
			callback(err,failureInfoDic);
			return;
		}
	}
	console.log(failureInfoDic);
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
    res.render('ciDashboard',{ title: 'CI DashBoard' });
})
/*
router.get('/getOnBuild', function(req, res, next){
   
  getDuration(job,100,function(data){
    return res.json(data);
  }));
})*/

module.exports = router;
