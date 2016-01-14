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
    if (err) return callback(err);
  });  
};
