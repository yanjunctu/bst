/*
Pls refer to below URL for REST supplied by Bitbucket

https://developer.atlassian.com/static/rest/bitbucket-server/4.8.3/bitbucket-rest.html

*/

var request = require('request');

const BITBUCKET_HOST = 'https://bitbucket.mot-solutions.com'

const USER = 'amb4116'
const passwd = 'configQ2@'

var getPR = function(project,repo,state,startOffset,handlePR){

     var query = '?state='+state+'&start='+startOffset+'&limit=500'+'&order=OLDEST'
     var path = '/rest/api/1.0/projects/'+project+'/repos/'+repo+'/pull-requests'
     var url = BITBUCKET_HOST+path+query
      console.log(url)
     request.get({rejectUnauthorized: false,url: url,'auth': {
                                                         'user': USER,
                                                         'pass': passwd,
                                                         'sendImmediately': true
                                                       }},function (error, response, body) {
        handlePR(error,response,body)
    });
}

var getPRActivity = function(project,repo,PRId,handlePRActivity){

     var path = '/rest/api/1.0/projects/'+project+'/repos/'+repo+'/pull-requests/'+PRId+'/activities'
     var query = '?limit=500'
     var url = BITBUCKET_HOST+path+query
     request.get({rejectUnauthorized: false,url: url,'auth': {
                                                         'user': USER,
                                                         'pass': passwd,
                                                         'sendImmediately': true
                                                       }},function (error, response, body) {
        handlePRActivity(error,response,body)
    });
}

module.exports.getPR = getPR;
module.exports.getPRActivity = getPRActivity;