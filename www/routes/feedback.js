var express = require('express');
var router = express.Router();
var feedbackDbInterface = require('../models/feedbackDb');


/* GET users listing. */
router.post('/', function(req, res, next) {
  console.log(req.body.rateOfGit+" "+req.body.selfAdvise+" "+req.body.coreid)
  
  var saveItem = new feedbackDbInterface(Date.now(),req.body.coreid,req.body.rateOfGit,req.body.selfAdvise);
  
  saveItem.save(function(err) {
      if (err) {
        console.log("save fail");
        req.flash('error', err);
        return res.redirect('/');
      }
      console.log("saved");      
      req.flash('success', 'success');
      res.send('saved');
    })
  
});

module.exports = router;
