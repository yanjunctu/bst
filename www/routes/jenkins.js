var express = require('express');
var router = express.Router();
var jenkins = require('../models/jenkins.js');

/* GET feedback about git page. */
router.get('/getCurrent', function(req, res, next) {

jenkins.job_info('PCR-REPT-0-Trigger', function(err, data) {
  if (err){ return console.log(err); }
  console.log(data)
});

});

module.exports = router;
