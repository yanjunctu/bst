const fs = require('fs');
const Console = require('console').Console;
//const Console = console.Console;

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

var nodemailer = require('nodemailer');
// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport('smtps://user%40gmail.com:pass@smtp.gmail.com');

// setup e-mail data with unicode symbols
var mailOptions = {
    from: '"test" <test@test.com>', // sender address
    to: 'baocheng.su@motorolasolutions.com', // list of receivers
    subject: 'Test', // Subject line
    text: 'Hello world', // plaintext body
    html: '<b>Hello world</b>' // html body
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log(error);
    }
    console.log('Message sent: ' + info.response);
});


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

function onTimer(message)
{
	//logger.log('I am running!!!');
	count = count + 1;
	if (count > 60)
	{
		count = 60;
		logger.log('Booster Cron is down!!!');
		
		// issue an email
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

