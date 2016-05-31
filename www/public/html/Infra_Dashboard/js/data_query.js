
var configuration = {
	apihostname: 'http://booster',
	testhostname: 'http://localhost:8888'
};

var hostname = configuration.testhostname;



function ciStatus()
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
var CIStatus = eval({
	"idleState": {
		"status": "running",
		"duration": 0
	},
	"preCheckState": {
		"status": "not start",
		"duration": 2
	},
	"buildFwState": {
		"status": "not start",
		"duration": 3
	},
	"testFwState": {
		"status": "not start",
		"duration": 4
	},
	"buildWin32State": {
		"status": "not start",
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
			"subTime": "na",
			"submitter": "na",
			"subBranch": "na"
		}
	},
	"ciBlockInfo": {
		"result": "SUCCESS",
		"submitter": "",
		"releaseTag": "REPT_I02.07.01.37",
		"lastSuccessTag": ""
	}
});

function ciPending()
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
		"submitter": "Essen-A4741C",
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
	"buildResult": "SUCCESS",
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
	"buildResult": "FAILURE",
	"submitter": "Ye Blake-A5421C",
	"precheck": "SUCCESS",
	"onTargetBuild": "ABORTED",
	"offTargetBuild": "SUCCESS",
	"win32UT": "ABORTED",
	"win32IT": {
		"win32ITPart1": "FAILURE",
		"win32ITPart2": "ABORTED"
	}
}]
);