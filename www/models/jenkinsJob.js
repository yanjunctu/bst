
var request = require('request');
//Enable JOB
//curl -u pnw748:079ffabb999ca608c05753b7557f442f -k -X POST https://cars.ap.mot-solutions.com:8080/job/PCR-REPT-0-MultiJob/enable

//Disable JOB
//curl -u pnw748:079ffabb999ca608c05753b7557f442f -k -X POST https://cars.ap.mot-solutions.com:8080/job/PCR-REPT-0-MultiJob/disable
//URL = 'https://pnw748:079ffabb999ca608c05753b7557f442f@cars.ap.mot-solutions.com:8080/job/PCR-REPT-TEST1/disable';
URL = 'https://pnw748:079ffabb999ca608c05753b7557f442f@cars.ap.mot-solutions.com:8080/job/PCR-REPT-0-MultiJob/';
var jenkinsJobEnable = function(enable){
     url = URL+enable
     console.log("PCR-REPT-0-MultiJob:",enable)
     request.post({rejectUnauthorized: false,url: url},function (error, response, body) {
            if ( error || response.statusCode !== 200 ) {
                console.log(error)
                return;
            }
    });
}

module.exports = jenkinsJobEnable;
