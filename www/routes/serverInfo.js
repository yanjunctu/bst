var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');

var RepoInfoPath = "/var/opt/booster/boosterServerInfo"


var commOrgSizeStr = "Gitlab_Comm_OriginSize"
var commUsrSizeStr = "Gitlab_Comm_UserSize"
var commBrhCntStr = "Gitlab_Comm_BranchCnt"

var cypherOrgSizeStr = "Gitlab_Cypher_OriginSize"
var cypherUsrSizeStr = "Gitlab_Cypher_UserSize"
var cypherBrhCntStr = "Gitlab_Cypher_BranchCnt"

var bahamaOrgSizeStr = "Gitlab_Bahama_OriginSize"
var bahamaUsrSizeStr = "Gitlab_Bahama_UserSize"
var bahamaBrhCntStr = "Gitlab_Bahama_BranchCnt"

var days=30

var keyStrArray = [commOrgSizeStr, commUsrSizeStr, commBrhCntStr, cypherOrgSizeStr, cypherUsrSizeStr, cypherBrhCntStr, bahamaOrgSizeStr, bahamaUsrSizeStr, bahamaBrhCntStr];

var isValidRepoInfoKey = function (key, keyArray) {
  var found = false;
  for (var index = 0; index < keyArray.length; index++) {
    if (keyArray[index] == key) {
      found = true;
      break;
    }
  }

  return found;
}

/* GET Repo Info, including Repo size, Repo branches cnt*/
router.get('/repoInfo', function (req, res, next) {

  var infoStr = {}

  fs.readFile(RepoInfoPath, 'utf8', (err, data) => {
    if (err) {
      console.log("read file fail")
      res.end("fail")
      return
    }
    // convert whole text into arrays
    var lines = data.split('\n')

    for (var index = 0; index < lines.length; index++) {

      var line = lines[index]

      line = line.trim() // remove space

      if (line[0] == '#') {
        continue; //ignore comments begin with '#'
      }

      var lineArray = line.split('=')

      if (lineArray.length != 2) {
        continue // the line format must equal to 'name=value' so the length must equal to 2
      }

      lineArray[0] = lineArray[0].trim() //remove space, this is key
      lineArray[1] = lineArray[1].trim() //remove space, this is value

      var isKey = isValidRepoInfoKey(lineArray[0], keyStrArray);//is a valid key

      if (isKey == false) {
        continue; //ignore invalid key
      }

      infoStr[lineArray[0]] = lineArray[1];

    }
    res.json(infoStr)

  });

});

function fetchTestCaseNum(project,days,callback){

	var utStr = "/ut_report_";
	var dirname = "/mnt/REPT_Release/";
	//var dirname = "/vagrant/REPT_Release/";
	var reportfilePath;
	var oldestTimeStamp = (Math.round(new Date().getTime()))-(days * 24 * 60 * 60 * 1000);
	var creatTime;
	var caseNum_temp =0;
    var caseNum ={"filename":[],"num":[]};

	fs.readdir(dirname + project, function (err, files) {
		if(err){
			console.log(err);
			return;
		} 
		else {
			//files.forEach(function (file) 
			for(var i=0;i<files.length;i++)
			{
				var file = files[i];
				var filePath = path.normalize(dirname+ project+"/"+ file);

				var stats= fs.lstatSync(filePath);
				creatTime = stats.mtime.getTime();

				if(stats.isDirectory()&&creatTime>oldestTimeStamp){

					reportfilePath=filePath+utStr+file+".txt";
					if(fs.existsSync(reportfilePath)){
						var data=fs.readFileSync(reportfilePath,'utf8');
						// convert whole text into arrays
						var lines = data.split('\n')
						caseNum_temp = 0;
						for (var index = 0; index < lines.length; index++) {
							var line = lines[index];

							line = line.trim(); // remove space

							var regex =/Test\w*\s*OK\s\([0-9\s]*tests/;
							if(regex.test(line))
							{
							    //console.log(line);
								//regex=/[^\d\,]/g;
								regex=/[\w\s]*OK\s\(/;
								//regex =/([\w\s]*OK\s\()|(tests[\w\s\,]*\))/;
								var num = line.replace(regex,"");

								regex = /tests[\w\s\,]*\)/;
								var testNum = num.replace(regex,"");

								caseNum_temp = caseNum_temp +parseInt(testNum);
							}
						}
						caseNum.filename.push(file); 
						caseNum.num.push(caseNum_temp); 
					}				
				}
			}
		}
		callback(err,caseNum);
	});
}

router.get('/testCaseNum_Emer', function (req, res, next) {
    fetchTestCaseNum("REPT2.7_Emerald",days,function(err,data){
    return res.json(data);
  });
})

router.get('/testCaseNum_nonEmer', function (req, res, next) {
    fetchTestCaseNum("REPT2.7",days,function(err,data){
    return res.json(data);
  });
})

module.exports = router;