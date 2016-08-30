const fs = require('fs');
const Console = require('console').Console;
var email = require('../../www/models/email.js');

const output = fs.createWriteStream('./app/stdout.log');
//const errorOutput = fs.createWriteStream('./app/stderr.log');
//const errorOutput = fs.createWriteStream('./app/stdout.log');
const errorOutput = output;
// custom simple logger
const logger = new Console(output, errorOutput);
// use it like console
var count = 0;
//logger.log('count: %d', count);
//logger.error('1111count: %d', count);

const interval = 240;

function onFeedDog(message)
{
	logger.log('feed dog, pcid:', message.m_pcid);
	logger.log('feed dog, timestamp:', message.m_timestamp);
	if (message.m_pcid == 'boosterlinux')
	{
		
		count = 0;
	}
	else
	{
		onInvalidMessage(m);
	}
	
}

function sendEmails()
{
	// issue an email
	var subject = '[Notice!] Linux Cron is not working!';
	var msg ="Linux Cron is not working now, please check";
	var args = {
		'msg':msg,
		'subject':subject,
		"email":"boosterteam@motorolasolutions.com", 
		"win":"1" // this is a winserver
	};
	email.send(args);
}

function onTimer(message)
{
	//logger.log('I am running!!!');
	count = count + 1;
	if (count >= interval)
	{
		//count = 240;
		//count = 0;
		logger.log('Booster Cron is down!!!');
		//console.log('Booster Cron is down!!!');
		
		if (count % interval == 0)
		{
			sendEmails();
		}
	}
}

function onInvalidMessage(message)
{
	//TODO: log message to log file
	
}

process.on('message', (m) => {
	
	//logger.log('CHILD got message:', m);
	if (m.m_type == 'TIMER')
	{
		onTimer(m);
	}
	else if (m.m_type == 'FEED_DOG')
	{
		onFeedDog(m);
	}
	else
	{
		onInvalidMessage(m);
	}
});

