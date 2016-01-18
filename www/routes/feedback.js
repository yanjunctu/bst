var express = require('express');
var router = express.Router();
var dB = require('../models/feedbackDb.js');

/* GET users listing. */
router.post('/gitnew', function(req, res, next) {
  var saveItem = new dB.dbInterface(Date.now(),req.body.coreid,req.body.rateOfGit,req.body.selfAdvise);
  
  saveItem.save(function(err) {
      if (err) {
        //req.flash('error', err);
        return res.redirect('/');
      }
      //req.flash('success', 'success');
      res.send('saved');
      return false;
    })
  
});


/* GET feedback about git page. */
router.get('/gitall', function(req, res, next) {

  dB.dbInterface.getall(function(err,feedbacks)
  {
    if(err)
      return console.log("err in router.get");
    
    //console.log(feedbacks);
    res.render('feedbackSummary', { category: 'Git',feedbackCollection:feedbacks });
  })

});

module.exports = router;
