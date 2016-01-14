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
});

