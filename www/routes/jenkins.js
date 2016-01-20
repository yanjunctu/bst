var express = require('express');
var router = express.Router();
var jenkins = require('../models/jenkins.js');
var cnt=0;
/* GET feedback about git page. */
router.get('/getEmerState', function(req, res, next) {

/*
jenkins.job_info('PCR-REPT-0-Trigger', function(err, data) {
  if (err){ return console.log(err); }
  console.log(data)
});
*/
var stubStatus = "running";
if (++cnt%2==0)
  stubStatus = "running"
else
  stubStatus = "done"

var ciStatus = {
  "idleState":{"status":stubStatus,"duration":0},
  "preCheckState":{"status":stubStatus,"duration":2},
  "buildFwState":{"status":stubStatus,"duration":3},
  "testFwState":{"status":stubStatus,"duration":4},
  "buildWin32State":{"status":stubStatus,"duration":5},
  "testWin32State":{"status":stubStatus,"duration":0},
  "preReleaseState":{"status":stubStatus,"duration":0}
  
}
res.json(ciStatus);

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
