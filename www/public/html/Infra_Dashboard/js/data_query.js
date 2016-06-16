var configuration = {
	apihostname: 'http://booster',
	testhostname: 'http://localhost:8888'
};

//var hostname = configuration.apihostname;
var hostname = "http://" + location.host;


function get_getCIHistory(obj)
{
	 $.ajax({
        url: hostname + "/jenkins/getCIHistory",
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
						CIHistory.unshift(CIPendingReq.current);
					}
				}

				for (var i=0;i<CIPendingReq.queue.length;i++)
				{
					CIPendingReq.queue[i].buildResult = "QUEUING";
					CIHistory.unshift(CIPendingReq.queue[i]);
				}
				
				obj.setData(CIHistory.slice(0, obj.listCount));
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
            url: hostname + "/jenkins/getCIStatus",
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
            url: hostname + "/jenkins/getCIPendingReq",
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


var testCaseNum;
function get_testCaseNum()
{
    $.ajax({
        url: hostname + "/serverInfo/testCaseNum",
        dataType:'json',
        success: function(data){
            if (data != null) {
            	console.log(data);
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

function hero(name, XP)
{
    this.name=name;
    this.XP=XP;
}

var heroes = new Array();
function find_heroes()
{
  	var submitter = new Object();
	for(var i = 0; i < CIHistory.length; i++)
    {
		if(CIHistory[i].buildResult == "SUCCESS")
		{
			var name = CIHistory[i].submitter.toUpperCase();
			if(submitter[name])
			{
				submitter[name] += 1;	
			}
			else
			{
				submitter[name] = 1;
			}
		}
    }
	//console.log(heroes);

	heroes = [];
	for(var p in submitter)
    {	
		heroes.push(new hero(p, submitter[p]));
    }
    
	heroes.sort(function(a, b) {
		return b.XP - a.XP;
	});
}

function get_heroes(obj)
{
	obj.setData(heroes);
}
