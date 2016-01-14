var express = require('express');
var router = express.Router();

/* GET users listing. */
router.post('/', function(req, res, next) {
  console.log(req.body.rateOfGit+" "+req.body.selfAdvise+" "+req.body.coreid)
  //res.send('respond with a resource');
});

module.exports = router;
