var express = require('express');
var router = express.Router();
var path = require('path');
var fiber = require('fibers');
var Server = require('mongo-sync').Server;

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

function findParamValue(buildInfo, paramName) {
    if (!buildInfo || !buildInfo["actions"]) {
        return;
    }

    for (var i = 0; i < buildInfo["actions"].length; ++i) {
        if (!buildInfo["actions"][i]["parameters"]) {
            continue;
        }

        var params = buildInfo["actions"][i]["parameters"];
        for (var j = 0; j < params.length; ++j) {
            if (params[j]["name"] == paramName) {
                return params[j]["value"];
            }
        }
    }

    return;
}

function fetchTestCaseNum(project, days, callback){
    // Get the sum of the number of UT cases and IT cases from DB
    var server = new Server('127.0.0.1');
    var ret = {"filename": [], "num": []};
    var allTestJobs = ["CI-PCR-REPT-Win32_UT", "CI-PCR-REPT-Win32_IT-TEST-Part1", "CI-PCR-REPT-Win32_IT-TEST-Part2"];
    var timestamp = (new Date).getTime() - days*24*3600*1000;

    fiber(function() {
        var db = server.db("booster");
        var rlsColl = db.getCollection("CI-PCR-REPT-Git-Release");
        var docs = rlsColl.find({"result": "SUCCESS", "timestamp": {$gte: timestamp}}).sort({"number": 1}).toArray();
        var err = undefined;

        for (var i = 0; i < docs.length; ++i) {
            var rlsTag = findParamValue(docs[i], "NEW_BASELINE");
            var pattern = {"result": "SUCCESS", "actions.parameters": {$in: [{"name": "NEW_BASELINE", "value": rlsTag}]}};
            var num = 0;

            for (var j = 0; j < allTestJobs.length; ++j) {
                var testDocs = db.getCollection(allTestJobs[j]).find(pattern).sort({"number": -1}).toArray();

                // Maybe some consecutive builds have the same release tag, only care the latest one
                if (testDocs.length && "testcaseNum" in testDocs[0]) {
                    num += testDocs[0]["testcaseNum"];
                }
            }
            ret["filename"].push(rlsTag);
            ret["num"].push(num);
        }

        callback(err, ret);
    }).run();

    server.close();
}

router.get('/testCaseNum', function (req, res, next) {
    fetchTestCaseNum("REPT2.7",days,function(err,data){
    return res.json(data);
  });
})

module.exports = router;
