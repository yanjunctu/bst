
 var fetchBuildFInfo = function(){
    //$tblBody = $("#emerTbl");
	var $tblHead = $("#infoHead");
	var $tblBody = $("#infobody");
	var name;
	var percent;

	//clear table
	$tblHead.empty(); 
    $tblBody.empty(); 
	
	var titleFormat = "text-center text-info bg-info";
	var $hc1 = $("<td>").text(" ");
	$hc1.addClass(titleFormat);
	var $hc2 = $("<td>").text("all build number")
	$hc2.addClass(titleFormat);  
    var $hc3 = $("<td>").text("fail build number")
    $hc3.addClass(titleFormat);   
    var $hc4 = $("<td>").text("abort build number")
    $hc4.addClass(titleFormat); 
    var $addHrow = $("<tr>");
    $addHrow.append($hc1);
    $addHrow.append($hc2);
    $addHrow.append($hc3); 
    $addHrow.append($hc4); 
	
	var $addBrow1 = $("<tr>");
	var $addBrow2 = $("<tr>");
	var $bc1 = $("<td>").text("emerlad");
	$bc1.addClass("text-center");
	$addBrow1.append($bc1);
	
	var $bc2 = $("<td>").text("nonEmerlad");
	$bc2.addClass("text-center");
	$addBrow2.append($bc2);
	
	
    $.get("/jenkins/getEmeraldFailInfo",function (emerald){
	    var $bca1= $("<td>").text(emerald.allBuildNumber);
		$bca1.addClass("text-center");
	    percent =(emerald.allBuildNumber ==0)? NA:Math.round((emerald.failureNumber/emerald.allBuildNumber)*100);
	    var $bcf1= $("<td>").text(emerald.failureNumber+"("+percent+"%)");
		$bcf1.addClass("text-center");
	    percent =(emerald.allBuildNumber ==0)? NA:Math.round((emerald.abortedNumber/emerald.allBuildNumber)*100);
	    var $bct1= $("<td>").text(emerald.abortedNumber+"("+percent+"%)");
		$bct1.addClass("text-center");
		$addBrow1.append($bca1);
		$addBrow1.append($bcf1);
		$addBrow1.append($bct1);
		
		
	    $.get("/jenkins/getNonEmeraldFailInfo",function (nonEmerald){
			var $bca2= $("<td>").text(nonEmerald.allBuildNumber);
			$bca2.addClass("text-center");
			percent =(nonEmerald.allBuildNumber ==0)? NA:Math.round((nonEmerald.failureNumber/nonEmerald.allBuildNumber)*100);
			var $bcf2= $("<td>").text(nonEmerald.failureNumber+"("+percent+"%)");
			$bcf2.addClass("text-center");
			percent =(nonEmerald.allBuildNumber ==0)? NA:Math.round((nonEmerald.abortedNumber/nonEmerald.allBuildNumber)*100);
			var $bct2= $("<td>").text(nonEmerald.abortedNumber+"("+percent+"%)");
			$bct2.addClass("text-center");
			$addBrow2.append($bca2);
			$addBrow2.append($bcf2);
			$addBrow2.append($bct2);

			var len =(nonEmerald.failBuildName!=undefined)? nonEmerald.failBuildName.length:emerald.failBuildName.length;
			for(var i=0;i<len;i++)
			{
				if((nonEmerald.failBuildNum[i]!=0)||(emerald.failBuildNum[i]!=0))
				{
					name =(nonEmerald.failBuildNum[i]!=0)? nonEmerald.failBuildName[i]:emerald.failBuildName[i];
					var $hc = $("<td>").text(name);
					$hc.addClass(titleFormat);
					$addHrow.append($hc);
					
                    percent =(emerald.allBuildNumber ==0)? NA:Math.round((emerald.failBuildNum[i]/emerald.allBuildNumber)*100);	
					var $bc3 = $("<td>").text(emerald.failBuildNum[i]+"("+percent+"%)");
	                $bc3.addClass("text-center");
					$addBrow1.append($bc3);
					
                    percent =(nonEmerald.allBuildNumber ==0)? NA:Math.round((nonEmerald.failBuildNum[i]/nonEmerald.allBuildNumber)*100);	
					var $bc4 = $("<td>").text(nonEmerald.failBuildNum[i]+"("+percent+"%)");
	                $bc4.addClass("text-center");
					$addBrow2.append($bc4);
					
				}				
			}
		$tblHead.append($addHrow);
        $tblBody.append($addBrow1);
        $tblBody.append($addBrow2);
		
	    })
	
    })
}


var main = function(){

	var layout = {
        xaxis: {
        title: 'Build Number'},
        yaxis: {
        title: 'Build Duaration(m)'},
        margin: {
        t: 0},
    };
	fetchBuildFInfo();
	
  $.get("/jenkins/getTheWholeCI_emerald",function (result) {

    var plotHandler = document.getElementById('theWholeCIemerald');
	
    Plotly.plot( plotHandler, [{
        x: result.id_em,
        y: result.duration_em }], layout)

  })
  
    $.get("/jenkins/getTheWholeCI_nonemerald",function (result) {

    var plotHandler = document.getElementById('theWholeCInonemerald');

    Plotly.plot( plotHandler, [{
        x: result.id_non,
        y: result.duration_non }], layout)

  })


  
  $.get("/jenkins/getOnTargetBuild",function (result) {

	var trace1 = {
		x: result.id_em,
		y: result.duration_em,
		name: 'Emerald'
   };
	var trace2 = {
		x: result.id_non,
		y: result.duration_non,
		name: 'nonEerald'
   }; 
	data = [trace1,trace2];
	Plotly.newPlot('onTargetbuild', data, layout);

  })
        
  
    $.get("/jenkins/getOnTargetTest",function (result) {

	var trace1 = {
		x: result.id_em,
		y: result.duration_em,
		name: 'Emerald'
   };
	var trace2 = {
		x: result.id_non,
		y: result.duration_non,
		name: 'nonEerald'
   }; 
	data = [trace1,trace2];
	Plotly.newPlot('onTargetTest', data, layout);

  })
  
    $.get("/jenkins/getOffTargetBuild",function (result) {

	var trace1 = {
		x: result.id_em,
		y: result.duration_em,
		name: 'Emerald'
   };
	var trace2 = {
		x: result.id_non,
		y: result.duration_non,
		name: 'nonEerald'
   }; 
	data = [trace1,trace2];
	Plotly.newPlot('offTargetbuild', data, layout);

  })
  
    $.get("/jenkins/getOffTargetTest",function (result) {

	var trace1 = {
		x: result.id_em,
		y: result.duration_em,
		name: 'Emerald'
   };
	var trace2 = {
		x: result.id_non,
		y: result.duration_non,
		name: 'nonEerald'
   }; 
	data = [trace1,trace2];
	Plotly.newPlot('offTargetTest', data, layout);

  })
  
    $.get("/serverInfo/testCaseNum_Emer",function (result) {
	
	var plotHandler = document.getElementById('EmerTestCaseNum');
	var layout = {
        xaxis: {
        title: 'release Number'},
        yaxis: {
        title: 'case number'},
        margin: {
        t: 0},
    };
	    Plotly.plot( plotHandler, [{
        x: result.filename,
        y: result.num }], layout)
	
	})
	
    $.get("/serverInfo/testCaseNum_nonEmer",function (result) {
	
	var plotHandler = document.getElementById('nonEmerTestCaseNum');
	var layout = {
        xaxis: {
        title: 'release Number'},
        yaxis: {
        title: 'case number'},
        margin: {
        t: 0},
    };
	    Plotly.plot( plotHandler, [{
        x: result.filename,
        y: result.num }], layout)
	
	})
	
    $.get("/reposizeinfo/getreposize",function (reposize) {
	
	var plotHandlerRepoOriginal = document.getElementById('repoSizeOriginal');
    var plotHandlerRepoCheckout = document.getElementById('repoSizeCheckout');
	var plotHandlerBranch = document.getElementById('branchNumber');
	var layoutRepo = {
        xaxis: {
        title: 'time'},
        yaxis: {
        title: 'repo size (M)'},
        margin: {
        t: 0},
    };
	var layoutBranch = {
        xaxis: {
        title: 'time'},
        yaxis: {
        title: 'branch number'},
        margin: {
        t: 0},
    };
	
	
	var trace1 = {
		x: reposize.timestamp,
		y: reposize.Gitlab_Comm_OriginSize,
		name: 'Comm'
   };
	var trace2 = {
		x: reposize.timestamp,
		y: reposize.Gitlab_Comm_UserSize,
		name: 'Comm'
   };  
	var trace3 = {
		x: reposize.timestamp,
		y: reposize.Gitlab_Comm_BranchCnt,
		name: 'Comm'
	};  

	var repoDataOriginal = [trace1];
    var repoDataCheckout = [trace2];
	var branchData = [trace3];
	
	Plotly.plot( plotHandlerRepoOriginal, repoDataOriginal, layoutRepo);
	Plotly.plot( plotHandlerRepoCheckout, repoDataCheckout, layoutRepo);
	Plotly.plot( plotHandlerBranch, branchData, layoutBranch);	
	})
	

    $.get("/serverInfo/repoInfo",function (result) {
      

      // draw pie for repo size before checkout
      var MaxSize = 2048 //2G so far
      var usedSize = parseInt(result.Gitlab_Comm_OriginSize) + parseInt(result.Gitlab_Cypher_OriginSize) + parseInt(result.Gitlab_Bahama_OriginSize);
      var unusedSize = MaxSize - usedSize;

      var data = [{
        values: [usedSize, unusedSize],
        labels: ['used', 'unused'],
        type: 'pie'
		}];


      var layout = {
        height: 400,
        width: 600
      };

      Plotly.newPlot('originRepoSizePlot', data, layout);

      // draw pie for repo size after checkout

      MaxSize = 10240 //10G so far
      usedSize = parseInt(result.Gitlab_Comm_UserSize) + parseInt(result.Gitlab_Cypher_UserSize) + parseInt(result.Gitlab_Bahama_UserSize);
      unusedSize = MaxSize - usedSize;

      data = [{
        values: [usedSize, unusedSize],
        labels: ['used', 'unused'],
        type: 'pie'
		}];

      Plotly.newPlot('userRepoSizePlot', data, layout);

      // draw pie for repo branches counter
      MaxSize = 1000 //1000 branches so far
      usedSize = parseInt(result.Gitlab_Comm_BranchCnt) + parseInt(result.Gitlab_Cypher_BranchCnt) + parseInt(result.Gitlab_Bahama_BranchCnt);
      unusedSize = MaxSize - usedSize;

      data = [{
        values: [usedSize, unusedSize],
        labels: ['used', 'unused'],
        type: 'pie'
		}];

      Plotly.newPlot('repoBrhCntPlot', data, layout);
      

  })    
  /* Current Plotly.js version */
  
  
  console.log( Plotly.BUILD );
}

$(document).ready(main)
