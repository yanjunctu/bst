var jenkinsapi = require('jenkins-api');
var jenkins = jenkinsapi.init('https://pnw748:079ffabb999ca608c05753b7557f442f@10.193.226.152:8080', {strictSSL: false});

module.exports = jenkins;


