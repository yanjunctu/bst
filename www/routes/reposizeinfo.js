var express = require('express');
var router = express.Router();
var dB = require('../models/repoinfoDB.js');
var days=30;

router.get('/getreposize', function(req, res, next){
    dB.getreposize(days,function(err,repoinfo){
    return res.json(repoinfo);
  });
})

module.exports = router;
