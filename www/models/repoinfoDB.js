var exports = module.exports = {};
var repoinfoDB = require('./db.js');
function dataConvert(timestamp)
{
	var date = new Date(timestamp * 1000);
	var formattedDate = ('0' + date.getDate()).slice(-2) + '/' + ('0' + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear() + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
	console.log(formattedDate);
	return formattedDate;
}

function getreposize(days,callback)
{
  repoinfoDB.repoinfoDbModel.find(function (err, repoinfos) {
    var oldestTimeStamp = (Math.round(new Date().getTime())/1000)-(days * 24 * 60 * 60);
    var info = {};
	info.Gitlab_Comm_OriginSize=[];
	info.Gitlab_Comm_UserSize=[];
	info.Gitlab_Comm_BranchCnt=[];
	info.Gitlab_Cypher_OriginSize=[];
	info.Gitlab_Cypher_UserSize=[];
	info.Gitlab_Cypher_BranchCnt=[];
	info.Gitlab_Bahama_OriginSize=[];
	info.Gitlab_Bahama_UserSize=[];
	info.Gitlab_Bahama_BranchCnt=[];
	info.timestamp = [];
	
    repoinfos.forEach(function(repoinfo, index) {
		if(repoinfo.timestamp>oldestTimeStamp){
			info.Gitlab_Comm_OriginSize=push(repoinfo.Gitlab_Comm_OriginSize);
			info.Gitlab_Comm_UserSize=push(repoinfo.Gitlab_Comm_UserSize);
			info.Gitlab_Comm_BranchCnt=push(repoinfo.Gitlab_Comm_BranchCnt);
			info.Gitlab_Cypher_OriginSize=push(repoinfo.Gitlab_Cypher_OriginSize);
			info.Gitlab_Cypher_UserSize=push(repoinfo.Gitlab_Cypher_UserSize);
			info.Gitlab_Cypher_BranchCnt=push(repoinfo.Gitlab_Cypher_BranchCnt);
			info.Gitlab_Bahama_OriginSize=push(repoinfo.Gitlab_Bahama_OriginSize);
			info.Gitlab_Bahama_UserSize=push(repoinfo.Gitlab_Bahama_UserSize);
			info.Gitlab_Bahama_BranchCnt=push(repoinfo.Gitlab_Bahama_BranchCnt);
			info.timestamp = push(dataConvert(repoinfo.timestamp));
		}
    });
        
    return callback(err,info);
  })
};