
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
        x: result.id,
        y: result.duration }], layout)

  })
  
    $.get("/jenkins/getTheWholeCI_nonemerald",function (result) {

    var plotHandler = document.getElementById('theWholeCInonemerald');

    Plotly.plot( plotHandler, [{
        x: result.id,
        y: result.duration }], layout)

  })


  
  $.get("/jenkins/getOnTargetBuild",function (result) {

    var plotHandler = document.getElementById('onTargetbuild');

    Plotly.plot( plotHandler, [{
        x: result.id,
        y: result.duration }], layout)

  })
        

  
    $.get("/jenkins/getOnTargetTest",function (result) {

    var plotHandler = document.getElementById('onTargetTest');

    Plotly.plot( plotHandler, [{
        x: result.id,
        y: result.duration }], layout)

  })
  
    $.get("/jenkins/getOffTargetBuild",function (result) {

    var plotHandler = document.getElementById('offTargetbuild');

    Plotly.plot( plotHandler, [{
        x: result.id,
        y: result.duration }], layout)

  })
  
    $.get("/jenkins/getOffTargetTest",function (result) {

    var plotHandler = document.getElementById('offTargetTest');

    Plotly.plot( plotHandler, [{
        x: result.id,
        y: result.duration }], layout)

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
	
	var plotHandlerRepo = document.getElementById('repoSize');
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
		name: 'Comm_OriginSize'
   };
	var trace2 = {
		x: reposize.timestamp,
		y: reposize.Gitlab_Comm_UserSize,
		name: 'Comm_UserSize'
   };  
	var trace3 = {
		x: reposize.timestamp,
		y: reposize.Gitlab_Cypher_OriginSize,
			name: 'Cypher_OriginSize'
	};  
	var trace4 = {
		x: reposize.timestamp,
		y: reposize.Gitlab_Cypher_UserSize,
		name: 'Cypher_UserSize'
	};  
	var trace5 = {
		x: reposize.timestamp,
		y: reposize.Gitlab_Bahama_OriginSize,
		name: 'Bahama_OriginSize'
	};  
	var trace6 = {
		x: reposize.timestamp,
		y: reposize.Gitlab_Bahama_UserSize,
		name: 'Bahama_UserSize'
	}; 
	
	var trace7 = {
		x: reposize.timestamp,
		y: reposize.Gitlab_Comm_BranchCnt,
		name: 'Comm'
	};  
	var trace8 = {
		x: reposize.timestamp,
		y: reposize.Gitlab_Cypher_BranchCnt,
		name: 'Cypher'
	};  
	var trace9 = {
		x: reposize.timestamp,
		y: reposize.Gitlab_Bahama_BranchCnt,
		name: 'Bahama'
	}; 

	var repodata = [ trace1, trace2, trace3, trace4, trace5, trace6 ];
	var branchdata = [ trace7, trace8, trace9];
	
	Plotly.plot( plotHandlerRepo, repodata, layoutRepo);
	Plotly.plot( plotHandlerBranch, branchdata, layoutBranch);	
	})
	

    $.get("/serverInfo/repoInfo",function (result) {
      

      // draw pie for repo size before checkout
      var MaxSize = 1024 //1G so far
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

      MaxSize = 5120 //5G so far
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
