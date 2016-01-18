var exports = module.exports = {};
var feedbackDB = require('./db.js');

var feedbackDbInterface =  function(date,author,gitRate,detailComment)
{
  if(date)
    this.date = date;
  else
    this.date = Date.now();
  
  if(author)
    this.author = author;
  else
    this.author = "anonymous"
  
  this.gitRate = gitRate;
  
  if(detailComment)
    this.detailComment = detailComment;
  else
    this.detailComment = "NA"
  
};

exports.dbInterface = feedbackDbInterface;

feedbackDbInterface.prototype.save = function save(callback)
{
  var pFeedBackDbItem = new feedbackDB.feebackDbModel({ author: this.author ,raiseDate:this.date,gitRating:this.gitRate,detailComments:this.detailComment,adminComments:''}); 
  pFeedBackDbItem.save(function (err) {
    return callback(err);
  });  
};

feedbackDbInterface.getall = function getall(callback)
{
  feedbackDB.feebackDbModel.find(function (err, feedbacks) {
    
    var all = [];
    feedbacks.forEach(function(feedback, index) {
      var onefeedback = new feedbackDbInterface(feedback.raiseDate, feedback.author,feedback.gitRating,feedback.detailComments);
      all.push(onefeedback);
    });
        
    return callback(err,all);
  })
};