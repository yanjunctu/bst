var express = require('express');
var router = express.Router();
var fiber = require('fibers');
var Server = require('mongo-sync').Server;
var passWord = require('../models/password.js');

var KLOCWORKINFO = []

//const KW_INTERVAL = 60000*20; // 20 minutes
const CI_KLOCWORK_COLL_NAME = "klocwork";
var CILastKlocworkBuildID=374;
//var CILastKlocworkBuildID=0;
function dataConvert(timestamp)
{
	var date = new Date(timestamp);
	var formattedDate = ('0' + date.getDate()).slice(-2) + '/' + ('0' + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear() + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
	return formattedDate;
}
var updateKWInfo = function(callback){

    fiber(function() {
        var server = new Server('127.0.0.1');
        var db = server.db("booster");

        var klocworkDocs = db.getCollection(CI_KLOCWORK_COLL_NAME).find({"buildNumber": {$gt: CILastKlocworkBuildID}}).sort({"buildNumber": -1}).toArray();

        klocworkDocs.forEach(function(doc) {

            //entry["ignore"] ='<input type="radio" value=doc["releaseTag"]> cancel</input>'
            issues = doc["issueIDs"]

            issues.forEach(function(ID){
                var entry = {};
            
                entry["rlsTag"] = doc["releaseTag"];
                entry["submitter"] = doc["engineerName"];
                entry["time"] =dataConvert(doc["date"]);
                entry["issueID"] = ID;
                
                KLOCWORKINFO.push(entry);
            });

            if (doc["buildNumber"] > CILastKlocworkBuildID) {
                CILastKlocworkBuildID = doc["buildNumber"];
            }
        }); 
        server.close();
        callback(KLOCWORKINFO);
    }).run();
}

//updateKWInfo();
//setInterval(function() {
    //CILastKlocworkBuildID=374;
    //updateKWInfo();
//}, KW_INTERVAL);


var updateRecord = function(kwRecord){
    
    fiber(function() {
        var server = new Server('127.0.0.1');
        var db = server.db("booster");
        
        for(var index=0;index<(kwRecord.length/2);index++){   
            rlstag = kwRecord[2*index]
            updateID = kwRecord[2*index+1]
            var klocworkDocs = db.getCollection(CI_KLOCWORK_COLL_NAME).find({"releaseTag" : rlstag}).toArray();
            var newIssueID = [];
            var oldIssueID = klocworkDocs[0]["issueIDs"]
            for( var i =0 ; i< oldIssueID.length;i++){
                if(oldIssueID[i]!=updateID){
                    newIssueID.push(oldIssueID[i]) 
                }
            }
            console.log(updateID)
            var ignoreID = klocworkDocs[0]["ignoreIDs"]
            ignoreID.push(updateID)
            db.getCollection(CI_KLOCWORK_COLL_NAME).update({ "releaseTag" : rlstag},{$set:{"issueIDs":newIssueID,"ignoreIDs":ignoreID}})
        }
        KLOCWORKINFO =[]
        CILastKlocworkBuildID=374;
        //updateKWInfo()
        server.close();
    }).run();
    return "SUCCESS"
    
    
}
router.get('/', function(req, res, next) {
  res.render('klocwork', { title: 'klocwork' });
});

router.get('/getInfo', function(req, res, next){
    KLOCWORKINFO =[]
    CILastKlocworkBuildID=374;
    updateKWInfo(function(data){
        return res.json(data);
    })
})
router.post('/cancelRecorde', function(req, res, next){

    var password = req.body.password;
    var kwRecord = req.body['recode[]'];

    passWord.verify("klocwork",password,function(result){
        if (result){
            
            status = updateRecord(kwRecord)
            
        }
        else{
            status = "Invalid password"
        }
        res.send(status)
    })
})




module.exports = router;
