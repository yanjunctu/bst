var exports = module.exports = {};
var feedbackDbModel = require('./db').feebackDbModel;

function feedbackDbInterface(date,author,gitRate,detailComment)
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

exports = feedbackDbInterface;

feedbackDbInterface.prototype.save = function save(callback)
{
  console.log("enter feedbackDbInterface.prototype.save");  
  var pFeedBackDbItem = new feedbackDbModel({ author: this.author ,raiseDate:this.date,gitRating:this.gitRate,detailComments:this.detailComment,adminComments:''}); 
  pFeedBackDbItem.save(function (err) {
    if (err) return callback(err);
  });  
}
