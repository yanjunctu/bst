
var configuration = {
	apihostname: 'http://booster',
	testhostname: 'http://localhost:8888'
};

//var hostname = configuration.apihostname;
//var hostname = configuration.testhostname;
var hostname = "http://" + location.host;

var pseudo_pgress = 0;

function formatTime(time_string)
{
	var time;
    if(time_string)
    {
        var t = time_string.split(" ");
        var d = t[0].split("/");
        var h = t[1].split(":");	            
        time = d[0]+"/"+d[1]+" "+h[0]+":"+h[1];
        //console.log(time);
    }
    return time;
}

function getName(name_string)
{
	var name;
    if(name_string)
    {
        name = name_string.split("-");
    }
    return name[0];
}

function getCoreID(name_string)
{
	var name;
    if(name_string)
    {
        name = name_string.split("-");
    }
    return name[1].replace(/(^\s*)|(\s*$)/g,'');
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

//http://booster/jenkins/getCIStatus
var CIStatus = eval(
{
	"idleState": {
		"status": "done",
		"duration": 0
	},
	"preCheckState": {
		"status": "done",
		"duration": 2
	},
	"buildFwState": {
		"status": "running",
		"duration": 3
	},
	"testFwState": {
		"status": "not start",
		"duration": 4
	},
	"buildWin32State": {
		"status": "running",
		"duration": 5
	},
	"testWin32State": {
		"status": "not start",
		"duration": 0
	},
	"preReleaseState": {
		"status": "not start",
		"duration": 0
	},
	"overall": {
		"current": {
			"branch": "na",
			"subTime": 1464682276491,
			"submitter": "xiaofang xie - vnm687",
			"subBranch": "IR_2.7_vnm687_singlcFix_sfr"
		}
	},
	"ciBlockInfo": {
		"result": "SUCCESS",
		"submitter": "",
		"releaseTag": "REPT_I02.07.01.41",
		"lastSuccessTag": ""
	}
}

);

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

//http://booster/jenkins/getCIPendingReq
var CIPendingReq = eval(
{
	"current": {
		"submitter": "Sync...",
		"subBranch": "IR_2.7_a5421c_regInfoBackup_fix",
		"subTime": 1464666588094
	},
	"queue": [
/*		{
			"submitter": "Essen-A5421C",
			"subBranch": "IR_2.7_a5421c_regInfoBackup_fix",
			"subTime": 1464666588094
		},
*/
	]
}
);


//http://booster/jenkins/getCIHistory
var CIHistory = eval(
[{
	"buildID": 1,
	"buildResult": "FAILURE",
	"submitter": "Fu Shang-Hai-PNW748",
	"precheck": "SUCCESS",
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 2,
	"buildResult": "ABORTED",
	"submitter": "Fu Shang-Hai-PNW748"
}, {
	"buildID": 3,
	"buildResult": "ABORTED",
	"submitter": "RuRong.huang-qpcb36"
}, {
	"buildID": 4,
	"buildResult": "FAILURE",
	"submitter": "Fu Shang-Hai-PNW748"
}, {
	"buildID": 5,
	"buildResult": "FAILURE",
	"submitter": "Fu Shang-Hai-PNW748",
	"precheck": "FAILURE"
}, {
	"buildID": 6,
	"buildResult": "FAILURE",
	"submitter": "Fu Shang-Hai-PNW748",
	"precheck": "FAILURE"
}, {
	"buildID": 7,
	"buildResult": "FAILURE",
	"submitter": "Fu Shang-Hai-PNW748",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "FAILURE"
}, {
	"buildID": 8,
	"buildResult": "FAILURE",
	"submitter": "Fu Shang-Hai-PNW748",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 9,
	"buildResult": "ABORTED",
	"submitter": "Fu Shang-Hai-PNW748"
}, {
	"buildID": 10,
	"buildResult": "SUCCESS",
	"submitter": "Fu Shang-Hai-PNW748",
	"precheck": "SUCCESS",
	"rlsTime": "4/22/2016 4:55:50 PM",
	"rlsTag": "REPT_I02.07.01.03",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 11,
	"buildResult": "ABORTED",
	"submitter": "RuRong.huang-qpcb36"
}, {
	"buildID": 12,
	"buildResult": "ABORTED",
	"submitter": "RuRong.huang-qpcb36"
}, {
	"buildID": 13,
	"buildResult": "ABORTED",
	"submitter": "RuRong.huang-qpcb36"
}, {
	"buildID": 14,
	"buildResult": "ABORTED",
	"submitter": "Fu Shang-Hai-PNW748",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "ABORTED"
}, {
	"buildID": 15,
	"buildResult": "FAILURE",
	"submitter": "Fu Shang-Hai-PNW748",
	"precheck": "SUCCESS",
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 16,
	"buildResult": "FAILURE",
	"submitter": "Fu Shang-Hai-PNW748",
	"precheck": "SUCCESS",
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 17,
	"buildResult": "SUCCESS",
	"submitter": "Fu Shang-Hai-PNW748",
	"precheck": "SUCCESS",
	"rlsTime": "4/23/2016 2:01:28 AM",
	"rlsTag": "REPT_I02.07.01.04",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 18,
	"buildResult": "ABORTED",
	"submitter": "RuRong.huang-qpcb36"
}, {
	"buildID": 19,
	"buildResult": "SUCCESS",
	"submitter": "RuRong.huang-qpcb36",
	"precheck": "SUCCESS",
	"rlsTime": "4/25/2016 11:52:02 AM",
	"rlsTag": "REPT_I02.07.01.05",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 20,
	"buildResult": "SUCCESS",
	"submitter": "RuRong.huang-qpcb36",
	"precheck": "SUCCESS",
	"rlsTime": "4/25/2016 1:12:42 PM",
	"rlsTag": "REPT_I02.07.01.06",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 21,
	"buildResult": "SUCCESS",
	"submitter": "RuRong.huang-qpcb36",
	"precheck": "SUCCESS",
	"rlsTime": "4/25/2016 3:53:33 PM",
	"rlsTag": "REPT_I02.07.01.07",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 22,
	"buildResult": "FAILURE",
	"submitter": "RuRong.huang-qpcb36",
	"precheck": "FAILURE"
}, {
	"buildID": 23,
	"buildResult": "SUCCESS",
	"submitter": "RuRong.huang-qpcb36",
	"precheck": "SUCCESS",
	"rlsTime": "4/25/2016 5:36:29 PM",
	"rlsTag": "REPT_I02.07.01.08",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 24,
	"buildResult": "SUCCESS",
	"submitter": "JDGV38",
	"precheck": "SUCCESS",
	"rlsTime": "4/26/2016 5:20:07 PM",
	"rlsTag": "REPT_I02.07.01.09",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 26,
	"buildResult": "SUCCESS",
	"submitter": "Ning Liu - TGDM48",
	"precheck": "SUCCESS",
	"rlsTime": "4/29/2016 12:08:04 PM",
	"rlsTag": "REPT_I02.07.01.10",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 27,
	"buildResult": "SUCCESS",
	"submitter": "Dai xi-jdf638",
	"precheck": "SUCCESS",
	"rlsTime": "4/29/2016 3:57:29 PM",
	"rlsTag": "REPT_I02.07.01.11",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 28,
	"buildResult": "SUCCESS",
	"submitter": "HQCD83",
	"precheck": "SUCCESS",
	"rlsTime": "4/29/2016 5:24:13 PM",
	"rlsTag": "REPT_I02.07.01.12",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 3
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 29,
	"buildResult": "FAILURE",
	"submitter": "JHG487",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 30,
	"buildResult": "FAILURE",
	"submitter": "JHG487",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "ABORTED"
}, {
	"buildID": 31,
	"buildResult": "FAILURE",
	"submitter": "JHG487",
	"precheck": "SUCCESS",
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 32,
	"buildResult": "FAILURE",
	"submitter": "JHG487",
	"precheck": "SUCCESS",
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 33,
	"buildResult": "SUCCESS",
	"submitter": "JHG487",
	"precheck": "SUCCESS",
	"rlsTime": "5/3/2016 6:57:19 PM",
	"rlsTag": "REPT_I02.07.01.13",
	"codeStaticCheck": {
		"build": 2,
		"klocwork": 4
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 34,
	"buildResult": "SUCCESS",
	"submitter": "RuRong.huang-qpcb36",
	"precheck": "SUCCESS",
	"rlsTime": "5/5/2016 4:09:07 PM",
	"rlsTag": "REPT_I02.07.01.14",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"coverage": "94.7%"
}, {
	"buildID": 35,
	"buildResult": "FAILURE",
	"submitter": "Ning Liu - TGDM48",
	"precheck": "SUCCESS",
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 36,
	"buildResult": "SUCCESS",
	"submitter": "RuRong.huang-qpcb36",
	"precheck": "SUCCESS",
	"rlsTime": "5/5/2016 5:51:51 PM",
	"rlsTag": "REPT_I02.07.01.15",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"coverage": "94.7%"
}, {
	"buildID": 37,
	"buildResult": "FAILURE",
	"submitter": "Ning Liu - TGDM48",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 38,
	"buildResult": "SUCCESS",
	"submitter": "RuRong.huang-qpcb36",
	"precheck": "SUCCESS",
	"rlsTime": "5/6/2016 10:47:47 AM",
	"rlsTag": "REPT_I02.07.01.16",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"coverage": "94.7%"
}, {
	"buildID": 39,
	"buildResult": "SUCCESS",
	"submitter": "Ning Liu - TGDM48",
	"precheck": "SUCCESS",
	"rlsTime": "5/6/2016 12:00:09 PM",
	"rlsTag": "REPT_I02.07.01.17",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"coverage": "94.7%",
	"onTargetSanity": "SUCCESS",
	"extRegression": "FAILURE"
}, {
	"buildID": 40,
	"buildResult": "FAILURE",
	"submitter": "Guojin Wei-A21983",
	"precheck": "SUCCESS",
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 41,
	"buildResult": "FAILURE",
	"submitter": "Guojin Wei-A21983",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 42,
	"buildResult": "FAILURE",
	"submitter": "Guojin Wei-A21983",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 43,
	"buildResult": "FAILURE",
	"submitter": "Guojin Wei-A21983",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 44,
	"buildResult": "FAILURE",
	"submitter": "Guojin Wei-A21983",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 45,
	"buildResult": "FAILURE",
	"submitter": "Guojin Wei-A21983",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 46,
	"buildResult": "FAILURE",
	"submitter": "Guojin Wei-A21983",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 47,
	"buildResult": "FAILURE",
	"submitter": "Guojin Wei-A21983",
	"precheck": "SUCCESS",
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 48,
	"buildResult": "SUCCESS",
	"submitter": "Fu Shang-Hai-PNW748",
	"precheck": "SUCCESS",
	"rlsTime": "5/16/2016 5:59:09 PM",
	"rlsTag": "REPT_I02.07.01.18",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.7%",
	"extRegression": "FAILURE"
}, {
	"buildID": 49,
	"buildResult": "FAILURE",
	"submitter": "Ella Liu-wpf643",
	"precheck": "FAILURE"
}, {
	"buildID": 50,
	"buildResult": "FAILURE",
	"submitter": "Ella Liu-wpf643",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "ABORTED"
}, {
	"buildID": 51,
	"buildResult": "FAILURE",
	"submitter": "Ella Liu-wpf643",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "ABORTED"
}, {
	"buildID": 52,
	"buildResult": "FAILURE",
	"submitter": "Ella Liu-wpf643",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "SUCCESS",
	"win32UT": "ABORTED",
	"win32IT": {
		"win32ITPart1": "FAILURE",
		"win32ITPart2": "ABORTED"
	}
}, {
	"buildID": 53,
	"buildResult": "SUCCESS",
	"submitter": "Ella Liu-wpf643",
	"precheck": "SUCCESS",
	"rlsTime": "5/17/2016 6:22:17 PM",
	"rlsTag": "REPT_I02.07.01.19",
	"codeStaticCheck": {
		"build": 72,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"extRegression": "FAILURE"
}, {
	"buildID": 54,
	"buildResult": "SUCCESS",
	"submitter": "Sun Xiaocong-WGRQ43",
	"precheck": "SUCCESS",
	"rlsTime": "5/18/2016 11:16:46 AM",
	"rlsTag": "REPT_I02.07.01.20",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"onTargetSanity": "SUCCESS"
}, {
	"buildID": 55,
	"buildResult": "FAILURE",
	"submitter": "Su Huang-TXJB86",
	"precheck": "SUCCESS",
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "ABORTED",
	"win32IT": {
		"win32ITPart1": "ABORTED",
		"win32ITPart2": "FAILURE"
	}
}, {
	"buildID": 56,
	"buildResult": "SUCCESS",
	"submitter": "Kang Kevin-JDGV38",
	"precheck": "SUCCESS",
	"rlsTime": "5/18/2016 2:28:09 PM",
	"rlsTag": "REPT_I02.07.01.21",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	}
}, {
	"buildID": 57,
	"buildResult": "SUCCESS",
	"submitter": "Su Huang-TXJB86",
	"precheck": "SUCCESS",
	"rlsTime": "5/18/2016 4:36:38 PM",
	"rlsTag": "REPT_I02.07.01.22",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 5
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.8%"
}, {
	"buildID": 58,
	"buildResult": "SUCCESS",
	"submitter": "Xue Renjie-JFRC74",
	"precheck": "SUCCESS",
	"rlsTime": "5/18/2016 5:34:36 PM",
	"rlsTag": "REPT_I02.07.01.23",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.8%",
	"extRegression": "FAILURE"
}, {
	"buildID": 59,
	"buildResult": "FAILURE",
	"submitter": "GongWang-gkph87",
	"precheck": "SUCCESS",
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "FAILURE",
		"win32ITPart2": "ABORTED"
	}
}, {
	"buildID": 60,
	"buildResult": "FAILURE",
	"submitter": "Kang Kevin-JDGV38"
}, {
	"buildID": 61,
	"buildResult": "FAILURE",
	"submitter": "Ning Liu - TGDM48"
}, {
	"buildID": 62,
	"buildResult": "SUCCESS",
	"submitter": "GongWang-gkph87",
	"precheck": "SUCCESS",
	"rlsTime": "5/19/2016 11:03:27 AM",
	"rlsTag": "REPT_I02.07.01.24",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 2
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.8%"
}, {
	"buildID": 63,
	"buildResult": "FAILURE",
	"submitter": "Ning Liu - TGDM48",
	"precheck": "SUCCESS",
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "ABORTED",
	"win32IT": {
		"win32ITPart1": "FAILURE",
		"win32ITPart2": "FAILURE"
	}
}, {
	"buildID": 64,
	"buildResult": "SUCCESS",
	"submitter": "Ning Liu - TGDM48",
	"precheck": "SUCCESS",
	"rlsTime": "5/19/2016 1:37:42 PM",
	"rlsTag": "REPT_I02.07.01.25",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.8%",
	"onTargetSanity": "SUCCESS"
}, {
	"buildID": 65,
	"buildResult": "SUCCESS",
	"submitter": "Eagle Liaw-RQT768",
	"precheck": "SUCCESS",
	"rlsTime": "5/19/2016 6:04:09 PM",
	"rlsTag": "REPT_I02.07.01.26",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.8%"
}, {
	"buildID": 66,
	"buildResult": "SUCCESS",
	"submitter": "Ning Liu - TGDM48",
	"precheck": "SUCCESS",
	"rlsTime": "5/19/2016 6:53:09 PM",
	"rlsTag": "REPT_I02.07.01.27",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 1
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.8%",
	"onTargetSanity": "SUCCESS"
}, {
	"buildID": 67,
	"buildResult": "FAILURE",
	"submitter": "Zhidong Jiang-XVPQ68",
	"precheck": "FAILURE"
}, {
	"buildID": 68,
	"buildResult": "FAILURE",
	"submitter": "Zhidong Jiang-XVPQ68",
	"precheck": "FAILURE"
}, {
	"buildID": 69,
	"buildResult": "FAILURE",
	"submitter": "Zhidong Jiang-XVPQ68",
	"precheck": "FAILURE"
}, {
	"buildID": 70,
	"buildResult": "FAILURE",
	"submitter": "Zhidong Jiang-XVPQ68",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "FAILURE"
}, {
	"buildID": 71,
	"buildResult": "ABORTED",
	"submitter": "Zhidong Jiang-XVPQ68"
}, {
	"buildID": 72,
	"buildResult": "FAILURE",
	"submitter": "Zhidong Jiang-XVPQ68",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "ABORTED"
}, {
	"buildID": 73,
	"buildResult": "FAILURE",
	"submitter": "Zhidong Jiang-XVPQ68",
	"precheck": "FAILURE"
}, {
	"buildID": 74,
	"buildResult": "FAILURE",
	"submitter": "Zhidong Jiang-XVPQ68",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "ABORTED"
}, {
	"buildID": 75,
	"buildResult": "FAILURE",
	"submitter": "Zhidong Jiang-XVPQ68",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "ABORTED"
}, {
	"buildID": 76,
	"buildResult": "SUCCESS",
	"submitter": "Zhidong Jiang-XVPQ68",
	"rlsTime": "5/20/2016 12:22:23 AM",
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.8%"
}, {
	"buildID": 77,
	"buildResult": "ABORTED",
	"submitter": "Kang Kevin-JDGV38"
}, {
	"buildID": 78,
	"buildResult": "FAILURE",
	"submitter": "Zhidong Jiang-XVPQ68",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "ABORTED"
}, {
	"buildID": 79,
	"buildResult": "FAILURE",
	"submitter": "Zhidong Jiang-XVPQ68",
	"precheck": "SUCCESS",
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "FAILURE",
	"win32IT": {
		"win32ITPart1": "ABORTED",
		"win32ITPart2": "ABORTED"
	}
}, {
	"buildID": 80,
	"buildResult": "SUCCESS",
	"submitter": "Zhidong Jiang-XVPQ68",
	"precheck": "SUCCESS",
	"rlsTime": "5/20/2016 2:02:35 PM",
	"rlsTag": "REPT_I02.07.01.28",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"onTargetSanity": "SUCCESS",
	"extRegression": "SUCCESS"
}, {
	"buildID": 81,
	"buildResult": "FAILURE",
	"submitter": "Shanghai Fu-PNW748"
}, {
	"buildID": 82,
	"buildResult": "FAILURE",
	"submitter": "Shanghai Fu-PNW748"
}, {
	"buildID": 83,
	"buildResult": "FAILURE",
	"submitter": "Shanghai Fu-PNW748",
	"precheck": "FAILURE"
}, {
	"buildID": 84,
	"buildResult": "FAILURE",
	"submitter": "Shanghai Fu-PNW748",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "FAILURE"
}, {
	"buildID": 85,
	"buildResult": "FAILURE",
	"submitter": "Shanghai Fu-PNW748",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "FAILURE"
}, {
	"buildID": 86,
	"buildResult": "SUCCESS",
	"submitter": "Shanghai Fu-PNW748",
	"rlsTime": "5/23/2016 12:15:20 PM",
	"rlsTag": "REPT_D02.07.00.02",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS"
}, {
	"buildID": 87,
	"buildResult": "FAILURE",
	"submitter": "Wu YaMing-CWTK73",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "FAILURE"
}, {
	"buildID": 88,
	"buildResult": "FAILURE",
	"submitter": "Wu YaMing-CWTK73",
	"precheck": "SUCCESS",
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "FAILURE",
	"win32IT": {
		"win32ITPart1": "ABORTED",
		"win32ITPart2": "ABORTED"
	}
}, {
	"buildID": 89,
	"buildResult": "SUCCESS",
	"submitter": "Wu YaMing-CWTK73",
	"precheck": "SUCCESS",
	"rlsTime": "5/23/2016 3:38:46 PM",
	"rlsTag": "REPT_I02.07.01.29",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.8%",
	"onTargetSanity": "SUCCESS"
}, {
	"buildID": 90,
	"buildResult": "FAILURE",
	"submitter": "Kang Kevin-JDGV38",
	"precheck": "FAILURE"
}, {
	"buildID": 91,
	"buildResult": "FAILURE",
	"submitter": "Kang Kevin-JDGV38",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "SUCCESS",
	"win32UT": "ABORTED",
	"win32IT": {
		"win32ITPart1": "ABORTED",
		"win32ITPart2": "ABORTED"
	}
}, {
	"buildID": 92,
	"buildResult": "SUCCESS",
	"submitter": "Kang Kevin-JDGV38",
	"precheck": "SUCCESS",
	"rlsTime": "5/24/2016 4:16:05 PM",
	"rlsTag": "REPT_I02.07.01.30",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.8%",
	"onTargetSanity": "SUCCESS"
}, {
	"buildID": 93,
	"buildResult": "FAILURE",
	"submitter": "Dai xi-jdf638",
	"precheck": "SUCCESS",
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "FAILURE",
	"win32IT": {
		"win32ITPart1": "ABORTED",
		"win32ITPart2": "ABORTED"
	}
}, {
	"buildID": 94,
	"buildResult": "FAILURE",
	"submitter": "rurong.huang-qpcb36",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "FAILURE"
}, {
	"buildID": 95,
	"buildResult": "FAILURE",
	"submitter": "rurong.huang-qpcb36",
	"precheck": "FAILURE"
}, {
	"buildID": 96,
	"buildResult": "FAILURE",
	"submitter": "rurong.huang-qpcb36",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "FAILURE"
}, {
	"buildID": 97,
	"buildResult": "FAILURE",
	"submitter": "Dai xi-jdf638",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "FAILURE"
}, {
	"buildID": 98,
	"buildResult": "SUCCESS",
	"submitter": "Dai xi-jdf638",
	"precheck": "SUCCESS",
	"rlsTime": "5/25/2016 11:20:22 AM",
	"rlsTag": "REPT_I02.07.01.31",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.8%",
	"onTargetSanity": "SUCCESS"
}, {
	"buildID": 99,
	"buildResult": "FAILURE",
	"submitter": "Ning Liu - TGDM48",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "SUCCESS",
	"win32UT": "ABORTED",
	"win32IT": {
		"win32ITPart1": "ABORTED",
		"win32ITPart2": "ABORTED"
	}
}, {
	"buildID": 100,
	"buildResult": "FAILURE",
	"submitter": "rurong.huang-qpcb36",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "ABORTED"
}, {
	"buildID": 101,
	"buildResult": "FAILURE",
	"submitter": "Ning Liu - TGDM48",
	"precheck": "SUCCESS",
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "FAILURE",
	"win32IT": {
		"win32ITPart1": "ABORTED",
		"win32ITPart2": "ABORTED"
	}
}, {
	"buildID": 102,
	"buildResult": "SUCCESS",
	"submitter": "Ning Liu - TGDM48",
	"precheck": "SUCCESS",
	"rlsTime": "5/25/2016 2:21:08 PM",
	"rlsTag": "REPT_I02.07.01.32",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.8%",
	"onTargetSanity": "SUCCESS"
}, {
	"buildID": 103,
	"buildResult": "FAILURE",
	"submitter": "Dai xi-jdf638",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "SUCCESS",
	"win32UT": "ABORTED",
	"win32IT": {
		"win32ITPart1": "ABORTED",
		"win32ITPart2": "ABORTED"
	}
}, {
	"buildID": 104,
	"buildResult": "FAILURE",
	"submitter": "Dai xi-jdf638",
	"precheck": "FAILURE"
}, {
	"buildID": 105,
	"buildResult": "FAILURE",
	"submitter": "Dai xi-jdf638"
}, {
	"buildID": 106,
	"buildResult": "SUCCESS",
	"submitter": "rurong.huang-qpcb36",
	"precheck": "SUCCESS",
	"rlsTime": "5/26/2016 9:55:09 AM",
	"rlsTag": "REPT_I02.07.01.33",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.8%",
	"onTargetSanity": "SUCCESS"
}, {
	"buildID": 107,
	"buildResult": "ABORTED",
	"submitter": "rurong.huang-qpcb36",
	"precheck": "SUCCESS",
	"rlsTime": "5/26/2016 10:55:37 AM",
	"rlsTag": "REPT_I02.07.01.34",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.8%",
	"onTargetSanity": "SUCCESS"
}, {
	"buildID": 108,
	"buildResult": "FAILURE",
	"submitter": "Ning Liu - TGDM48",
	"precheck": "SUCCESS",
	"onTargetBuild": "FAILURE",
	"offTargetBuild": "SUCCESS",
	"win32UT": "ABORTED",
	"win32IT": {
		"win32ITPart1": "ABORTED",
		"win32ITPart2": "ABORTED"
	}
}, {
	"buildID": 109,
	"buildResult": "SUCCESS",
	"submitter": "Dai xi-jdf638",
	"precheck": "SUCCESS",
	"rlsTime": "5/26/2016 12:40:38 PM",
	"rlsTag": "REPT_I02.07.01.35",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.8%",
	"onTargetSanity": "SUCCESS"
}, {
	"buildID": 110,
	"buildResult": "FAILURE",
	"submitter": "Ning Liu - TGDM48",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "SUCCESS",
	"win32UT": "ABORTED",
	"win32IT": {
		"win32ITPart1": "ABORTED",
		"win32ITPart2": "FAILURE"
	}
}, {
	"buildID": 111,
	"buildResult": "SUCCESS",
	"submitter": "Ning Liu - TGDM48",
	"precheck": "SUCCESS",
	"rlsTime": "5/26/2016 2:53:55 PM",
	"rlsTag": "REPT_I02.07.01.36",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.8%"
}, {
	"buildID": 112,
	"buildResult": "SUCCESS",
	"submitter": "rurong.huang-qpcb36",
	"precheck": "SUCCESS",
	"rlsTime": "5/26/2016 4:02:26 PM",
	"rlsTag": "REPT_I02.07.01.37",
	"codeStaticCheck": {
		"build": 0,
		"klocwork": 0
	},
	"onTargetBuild": "SUCCESS",
	"offTargetBuild": "SUCCESS",
	"win32UT": "SUCCESS",
	"win32IT": {
		"win32ITPart1": "SUCCESS",
		"win32ITPart2": "SUCCESS"
	},
	"coverage": "94.8%",
	"onTargetSanity": "SUCCESS",
	"extRegression": "ABORTED"
}, {
	"buildID": 113,
	"buildResult": "RUNNING",
	"submitter": "Ye Blake-A5421C",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "SUCCESS",
	"win32UT": "ABORTED",
	"win32IT": {
		"win32ITPart1": "FAILURE",
		"win32ITPart2": "ABORTED"
	}
},
{
	"buildID": 114,
	"buildResult": "QUEUING",
	"submitter": "Ye Blake-A5421C",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "SUCCESS",
	"win32UT": "ABORTED",
	"win32IT": {
		"win32ITPart1": "FAILURE",
		"win32ITPart2": "ABORTED"
	}
}
]
);


//http://booster/jenkins/getTheWholeCI
var theWholeCI = eval(
{
	"id": ["154", "153", "138", "136", "116", "112", "111", "109", "107", "106", "102", "98", "92", "89", "86", "80", "76", "66", "65", "64", "62", "58", "57", "56", "54", "53", "48", "39", "38", "36", "34", "33"],
	"duration": [49.07908333333334, 51.461816666666664, 55.51263333333333, 53.323116666666664, 53.98406666666666, 57.37055, 73.5202, 73.51273333333333, 60.45793333333334, 49.94115, 53.20803333333333, 54.40781666666667, 53.23435, 52.47553333333333, 19.02005, 47.427616666666665, 39.72306666666667, 49.00338333333333, 41.15861666666667, 51.0356, 60.73388333333333, 57.9623, 58.768033333333335, 47.59688333333333, 45.85655, 44.6605, 42.03045, 44.05416666666667, 40.36821666666667, 45.0232, 40.27016666666667, 93.7232],
	"submitter": ["Liu Nick-CRV346", "Ye Blake-A5421C", "BraveLi-MRWQ78", "Ye Blake-A5421C", "Ma Xilai-DGBV47", "rurong.huang-qpcb36", "Ning Liu - TGDM48", "Dai xi-jdf638", "rurong.huang-qpcb36", "rurong.huang-qpcb36", "Ning Liu - TGDM48", "Dai xi-jdf638", "Kang Kevin-JDGV38", "Wu YaMing-CWTK73", "Shanghai Fu-PNW748", "Zhidong Jiang-XVPQ68", "Zhidong Jiang-XVPQ68", "Ning Liu - TGDM48", "Eagle Liaw-RQT768", "Ning Liu - TGDM48", "GongWang-gkph87", "Xue Renjie-JFRC74", "Su Huang-TXJB86", "Kang Kevin-JDGV38", "Sun Xiaocong-WGRQ43", "Ella Liu-wpf643", "Fu Shang-Hai-PNW748", "Ning Liu - TGDM48", "RuRong.huang-qpcb36", "RuRong.huang-qpcb36", "RuRong.huang-qpcb36", "JHG487"],
	"timestamp": [1464674207259, 1464670728170, 1464587015626, 1464581206043, 1464333457996, 1464246304527, 1464241223957, 1464233227987, 1464227709926, 1464224712993, 1464154076235, 1464143158002, 1464074571811, 1463985978037, 1463975778998, 1463721310166, 1463672560370, 1463652249722, 1463649779746, 1463633200811, 1463623363388, 1463560598834, 1463557072374, 1463550033307, 1463538655484, 1463477857616, 1463390228002, 1462504566185, 1462500445191, 1462439209633, 1462433331612, 1462267416226]
}
);


//console.log(parseInt(theWholeCI.duration[0]));
var theWholeCIduration = parseInt(theWholeCI.duration[0]);
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

//http://booster/serverInfo/testCaseNum
var testCases = eval(
{
	"filename": ["REPT_I02.07.01.13", "REPT_I02.07.01.14", "REPT_I02.07.01.15", "REPT_I02.07.01.16", "REPT_I02.07.01.17", "REPT_I02.07.01.18", "REPT_I02.07.01.19", "REPT_I02.07.01.20", "REPT_I02.07.01.21", "REPT_I02.07.01.22", "REPT_I02.07.01.23", "REPT_I02.07.01.24", "REPT_I02.07.01.25", "REPT_I02.07.01.26", "REPT_I02.07.01.27", "REPT_I02.07.01.29", "REPT_I02.07.01.30", "REPT_I02.07.01.31", "REPT_I02.07.01.32", "REPT_I02.07.01.33", "REPT_I02.07.01.34", "REPT_I02.07.01.35", "REPT_I02.07.01.36", "REPT_I02.07.01.37", "REPT_I02.07.01.38", "REPT_I02.07.01.39", "REPT_I02.07.01.40", "REPT_I02.07.01.41", "REPT_I02.07.01.42", "REPT_I02.07.01.43"],
	"num": [1320, 1320, 1320, 1320, 1320, 1320, 1401, 1401, 1401, 1403, 1403, 1403, 1403, 1403, 1403, 1403, 1403, 1403, 1403, 1403, 1403, 1403, 1403, 1403, 1403, 1403, 1403, 1403, 1403, 1403]
}
);

//console.log(testCaseNum.num[testCaseNum.num.length - 1]);
var testCaseNum = testCases.num[testCases.num.length - 1];
function get_testCaseNum()
{
    $.ajax({
        url: hostname + "/jenkins/getTheWholeCI",
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
function get_heroes()
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

