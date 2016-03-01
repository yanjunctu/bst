var express = require('express');
var router = express.Router();
var dB = require('../models/repoinfoDb.js');
var days=7;

router.get('/getrepoinfo', function(req, res, next){
    dB.getrepoinfo(days,function(err,repoinfo){
    return res.json(repoinfo);
  });
})

module.exports = router;
