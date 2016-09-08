var configuration = {
	apihostname: 'http://booster',
	testhostname: 'http://localhost:8888'
};

//var hostname = configuration.apihostname;
var hostname = "http://" + location.host;

//Summary data in past 7 days
var days_in_summary_hero = 7;

var number_in_statistic = 10;

function get_getCIHistory(obj)
{
	 $.ajax({
        url: hostname + "/jenkins/getCIHistory/"+project,
        dataType:'json',
        success: function(data){
            if (data != null) {

                CIHistory = eval(data);
                CIHistory.reverse();

				//todo: move the code to a better place.
				get_testCoverage();
				find_heroes();
				
				//add running & queuing task
				if(CIPendingReq.current)
				{
					CIPendingReq.current.buildResult = "RUNNING";
					if(CIPendingReq.current.submitter != "na")
					{
						CIPendingReq.current.buildID = ""; //just an indicator 
						CIPendingReq.current.startTime = parseInt(CIPendingReq.current.subTime);
						CIHistory.unshift(CIPendingReq.current);
					}
				}

				for (var i=0;i<CIPendingReq.queue.length;i++)
				{
					CIPendingReq.queue[i].buildID = "+" + (i + 1); //just an indicator 
					CIPendingReq.queue[i].startTime = parseInt(CIPendingReq.queue[i].subTime); 
					CIPendingReq.queue[i].buildResult = "QUEUING";
					CIHistory.unshift(CIPendingReq.queue[i]);
				}

				obj.setData(CIHistory.slice(0, obj.props.listCount));
            }
        },
        error: function(xhr,status,err){
            console.log(obj.url,status,err.toString());
        }
	}); 
    
    
}

function get_ciStatus()
{
        $.ajax({
            url: hostname + "/jenkins/getCIStatus/"+project,
            dataType:'json',
            success: function(data){
                if (data != null) {
                    CIStatus = eval(data);
                }
            },
            error: function(xhr,status,err){
                console.log(err.toString());
            }
        }); 	
}

function get_ciPending()
{
        $.ajax({
            url: hostname + "/jenkins/getCIPendingReq/"+project,
            dataType:'json',
            success: function(data){
                if (data != null) {
                    CIPendingReq = eval(data);                    
                }
            },
            error: function(xhr,status,err){
                console.log(err.toString());
            }
        }); 	
}


/*
var theWholeCIduration;
function get_theWholeCIduration()
{
    $.ajax({
        url: hostname + "/jenkins/getTheWholeCI",
        dataType:'json',
        success: function(data){
            if (data != null) {
                theWholeCI = eval(data);
                theWholeCIduration = parseInt(theWholeCI.duration[0]);
            }
        },
        error: function(xhr,status,err){
            console.log(err.toString());
        }
    }); 	
}
*/



var testCaseNum;
function get_testCaseNum()
{
    $.ajax({
        url: hostname + "/serverInfo/testCaseNum/"+project,
        dataType:'json',
        success: function(data){
            if (data != null) {
            	//console.log(data);
                testCases = eval(data);
                testCaseNum = testCases.num[testCases.num.length - 1];
            }
        },
        error: function(xhr,status,err){
            console.log(err.toString());
        }
    }); 	
}

var testCoverage;
function get_testCoverage()
{
    for(var i = 0; i < CIHistory.length; i++)
    {
   		if(CIHistory[i].coverage)
   		{
   			testCoverage = CIHistory[i].coverage;
   			//console.log("Coverage:" + CIHistory[i].coverage);
   			break;
   		}
    }	
}

var queueDuration = 0;
var releaseDuration = 0;
function get_queueStatistics()
{
	var qt = 0;
	var qcount = 0;
	var rt = 0;
	var rcount = 0;	

	for(var i = 0; i < CIHistory.length && rcount < number_in_statistic; i++)
    {
    	// filter IRs in the past x days
        if(CIHistory[i].queuewTime && CIHistory[i].buildResult == "SUCCESS"
			&& CIHistory[i].queuewTime < 3600000 * 8) //filter out queue time > 8 hours as outlier
        {
            qt += CIHistory[i].queuewTime;
			qcount += 1;
				//console.log(i, CIHistory[i].queuewTime,  CIHistory[i].queuewTime/3600000, qt/qcount/3600000);
        }

        if(CIHistory[i].duration && CIHistory[i].buildResult == "SUCCESS")
        {
            rt += CIHistory[i].duration;
            rcount += 1;
        }
    }
    
    var rd = new Date(parseInt(rt/rcount));
    releaseDuration = rd.toUTCString("en-US", {hour12: false, hour: '2-digit', minute:'2-digit'}).substring(18, 22);

    var qd = new Date(parseInt(qt/qcount));
    queueDuration = qd.toUTCString("en-US", {hour12: false, hour: '2-digit', minute:'2-digit'}).substring(18, 22);
	//console.log(rt, rcount, releaseDuration, qt, qcount, queueDuration);
}

function hero(name, core_id, XP)
{
	this.core_id = core_id;
    this.name = name;
    this.XP = XP;
}

var heroes = new Array();
function find_heroes()
{
  	var submitters = new Object();
  	var names = new Object();

	var date = new Date();
	date.setDate(date.getDate() - days_in_summary_hero);
	var miniseconds = date.getTime();

	for(var i = 0; i < CIHistory.length; i++)
    {
    	// filter the passed IR in the past x days
		if(CIHistory[i].buildResult == "SUCCESS" &&
			CIHistory[i].startTime > miniseconds)
		{
			var name = CIHistory[i].submitter;//.toUpperCase();

			//if we can find core id, use core id; if not, just use the name
			var cid = getCoreID(name);
			if("NULL" == cid)
			{
				cid = name;	
			}
			names[cid] = name;
			
			if(submitters[cid])
			{
				submitters[cid] += 1;
			}
			else
			{
				submitters[cid] = 1;
			}
		}
    }
	//console.log(heroes);

	heroes = [];
	for(var cid in names)
    {	
		heroes.push(new hero(names[cid], cid, submitters[cid]));
    }
    
	heroes.sort(function(a, b) {
		return b.XP - a.XP;
	});
}

function get_heroes(obj)
{
	obj.setData(heroes);
}
