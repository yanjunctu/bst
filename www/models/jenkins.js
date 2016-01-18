var jenkinsapi = require('jenkins-api');
var jenkins = jenkinsapi.init('https://jhv384:4aff12c2c2c0fba8342186ef0fd9e60c@10.193.226.152:8080', {strictSSL: false});

module.exports = jenkins;


