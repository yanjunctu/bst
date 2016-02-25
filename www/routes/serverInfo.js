var express = require('express');
var router = express.Router();
var fs = require('fs')

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

module.exports = router;