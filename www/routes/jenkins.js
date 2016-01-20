var express = require('express');
var router = express.Router();
var jenkins = require('../models/jenkins.js');

/* GET feedback about git page. */
router.get('/getCurrent', function(req, res, next) {

/*
jenkins.job_info('PCR-REPT-0-Trigger', function(err, data) {
  if (err){ return console.log(err); }
  console.log(data)
});
*/
var ciStatus = {
  "idle":{"status":"done","duration":0},
  "preInt":{"status":"done","duration":2},
  "onTgtBuild":{"status":"done","duration":3},
  "onTgtTst":{"status":"done","duration":4},
  "offTgtBuild":{"status":"done","duration":5},
  "offTgtTst":{"status":"doing","duration":0},
  "preRelease":{"status":"todo","duration":0}
  
}
res.json(ciStatus);

});

module.exports = router;
