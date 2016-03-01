var exports = module.exports = {};
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/booster');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  var feedbackDbSchema = mongoose.Schema({
      author: String,
      raiseDate: Date,
      gitRating:String,
      detailComments:String,
      adminComments:String
  });
  
  exports.feebackDbModel = mongoose.model('feebackDbModel', feedbackDbSchema);
  var repoinfoDbSchema = mongoose.Schema({
      timestamp: Number,      
	  Gitlab_Comm_OriginSize: Number,
      Gitlab_Comm_UserSize: Number,
      Gitlab_Comm_BranchCnt: Number,
      Gitlab_Bahama_OriginSize: Number,
      Gitlab_Bahama_UserSize: Number,
      Gitlab_Bahama_BranchCnt: Number,	  
      Gitlab_Cypher_OriginSize: Number,
      Gitlab_Cypher_UserSize: Number,
      Gitlab_Cypher_BranchCnt: Number
	  },
	  {
	   collection:'repoinfo'
  });
  
  exports.repoinfoDbModel = mongoose.model('repoinfo', repoinfoDbSchema);
});

