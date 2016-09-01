var express = require('express');
var router = express.Router();


/* Linux Healthy sub process*/
const cp = require('child_process');
const cp_lh = cp.fork('${__dirname}/../app/linux_healthy.js');

/* Event handler of feeding watchdog*/
var EventEmitter = require('events').EventEmitter;
var event = new EventEmitter(); 
event.on('feed', function(pcid, timestamp) { 

	//console.log('feed a dog'); 
	//console.log(pcid); 
	//console.log(timestamp); 
	// send message to linux healthy sub process
	cp_lh.send({ m_type: 'FEED_DOG', m_pcid: pcid, m_timestamp: timestamp});
	//console.log('feed a dog');
}); 

/* watchdog timer */
var watchdog = setInterval(function(){
	
	cp_lh.send({ m_type: 'TIMER'});
}, 1000); // a hour


/* #################### HTTP Method ######################## */


/* GET Linux keep alive page. */
router.get('/', function(req, res, next) {
	res.send('Linux keep alive');
});

/* POST Linux keep alive page. */
router.post('/', function(req, res, next) {
	
	// get pcid from json
	var pcid = req.body.pcid;
	var timestamp = req.body.timestamp;
	
	//console.log(pcid);
	//console.log(timestamp);
	
	// check 
	if ((pcid == undefined) || (timestamp == undefined))
	{
		console.log("error");
		res.send('Not a valid json');
	}
	else
	{
		// TODO: emit watchdog event
		setTimeout(function() { 
			event.emit('feed', pcid, timestamp);
		}, 1000);
		
		res.send('Linux keep alive');
	}
});

module.exports = router;
