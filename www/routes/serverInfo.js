var express = require('express');
var router = express.Router();
var path = require('path');
var fiber = require('fibers');
var Server = require('mongo-sync').Server;

var SIDELINE_PRJ = "REPT2.7"
var MAINLINE_PRJ = "REPT_MCL"
var ALL_PRJ = [MAINLINE_PRJ,SIDELINE_PRJ]

var days=30
var TESTCASE_NUM_INTERVAL = 60000*60*12 // 12 hours
// The testcase info is stored in timestamp ascending order
var testcaseNum = {}

ALL_PRJ.forEach(function(project){
     testcaseNum[project] = {"filename": [], "num": [], "timestamp": []}      
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

function fetchTestCaseNum(project,days){
    // Get the sum of the number of UT cases and IT cases from DB
    var allTestJobs = ["CI-PCR-REPT-Win32_UT", "CI-PCR-REPT-Win32_IT-TEST-Dist", "CI-PCR-REPT-Win32_IT-TEST-Part1", "CI-PCR-REPT-Win32_IT-TEST-Part2"];
    var timestamp = (new Date).getTime() - days*24*3600*1000;

    // Only save the data of the latest 'days' days
    while (0 != testcaseNum[project]["timestamp"].length) {
        if (testcaseNum[project]["timestamp"][0] >= timestamp) {
            break;
        }
        testcaseNum[project]["filename"].shift();
        testcaseNum[project]["num"].shift();
        testcaseNum[project]["timestamp"].shift();
    }
    // Get the latest timestamp saved in the obj
    if (0 != testcaseNum[project]["timestamp"].length) {
        timestamp = testcaseNum[project]["timestamp"][testcaseNum[project]["timestamp"].length-1];
    }
    fiber(function() {
        var server = new Server('127.0.0.1');
        var db = server.db("booster");
        var rlsColl = db.getCollection("CI-PCR-REPT-Git-Release");
        var docs = rlsColl.find({"result": "SUCCESS", "timestamp": {$gt: timestamp}}).sort({"number": 1}).toArray();
        var err = undefined;

        docs.forEach(function(doc){
            var rlsTag = findParamValue(doc, "NEW_BASELINE");
            var pattern = {"result": "SUCCESS", "actions.parameters": {$in: [{"name": "NEW_BASELINE", "value": rlsTag}]}};
            var num = 0;
            allTestJobs.forEach(function(testJob){
                var testDocs = db.getCollection(testJob).find(pattern).sort({"number": -1}).toArray();

                // Maybe some consecutive builds have the same release tag, only care the latest one
                if (testDocs.length && "testcaseNum" in testDocs[0]) {
                    num += testDocs[0]["testcaseNum"];
                }
            });
            testcaseNum[project]["filename"].push(rlsTag);
            testcaseNum[project]["num"].push(num);
            testcaseNum[project]["timestamp"].push(doc["timestamp"]);
        });

        server.close();
    }).run();
}
ALL_PRJ.forEach(function(project){
    fetchTestCaseNum(project,days);    
});

setInterval(function() {
    ALL_PRJ.forEach(function(project){
        fetchTestCaseNum(project,days);    
    });
}, TESTCASE_NUM_INTERVAL);

router.get('/testCaseNum/:prj', function (req, res, next) {
  var projName = req.params.prj;
  if (ALL_PRJ.indexOf(projName) !== -1){
    return res.json(testcaseNum[projName]);
  }
})


module.exports = router;
