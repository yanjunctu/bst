var express = require('express');
var router = express.Router();
var jenkins = require('../models/jenkins.js');
var cnt=0;

var getJobLastBuild = function(job,callback)
{
  var result;
  jenkins.last_build_info(job, function(err, data) {
    callback(err,data);
  });

};

/* GET feedback about git page. */
router.get('/getCurrentStatus', function(req, res, next) {

  /*
  jenkins.job_info('PCR-REPT-0-Trigger', function(err, data) {
    if (err){ return console.log(err); }
    console.log(data)
  });
  */
  var stubStatus = "not start";
  /*
  if (++cnt%2==0)
    stubStatus = "running"
  else
    stubStatus = "done"
  */

   var ciStatus = {
    "idleState":{"status":"running","duration":0},
    "preCheckState":{"status":stubStatus,"duration":2},
    "buildFwState":{"status":stubStatus,"duration":3},
    "testFwState":{"status":stubStatus,"duration":4},
    "buildWin32State":{"status":stubStatus,"duration":5},
    "testWin32State":{"status":stubStatus,"duration":0},
    "preReleaseState":{"status":stubStatus,"duration":0}
    
  };  

  
    getJobLastBuild('PCR-REPT-0-MultiJob',function(err,data){
    if(err) return;
    if (data.building==false){
      return res.json(ciStatus);
    }else {
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
              getJobLastBuild('PCR-REPT-On_Target_MultiJob',function(err,data){
              if(err) return;
              
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
              getJobLastBuild('PCR-REPT-Off_Target_MultiJob',function(err,data){
              if(err) return;
              
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
    return res.json(ciStatus);
    }
      

  });
  
  //console.log(ciStatus);


});

router.get('/getNonEmerState', function(req, res, next) {

/*
jenkins.job_info('PCR-REPT-0-Trigger', function(err, data) {
  if (err){ return console.log(err); }
  console.log(data)
});
*/
var ciStatus = {
  "idleState":{"status":"done","duration":0},
  "preCheckState":{"status":"done","duration":2},
  "buildFwState":{"status":"done","duration":3},
  "testFwState":{"status":"done","duration":4},
  "buildWin32State":{"status":"done","duration":5},
  "testWin32State":{"status":"done","duration":0},
  "preReleaseState":{"status":"done","duration":0}
  
}
res.json(ciStatus);

});

module.exports = router;
