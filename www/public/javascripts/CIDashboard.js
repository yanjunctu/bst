var PROJECT = "REPT2.7"

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
    //var $addBrow2 = $("<tr>");
    var $bc1 = $("<td>").text(PROJECT);
    $bc1.addClass("text-center");
    $addBrow1.append($bc1);
       
    
    $.get("/jenkins/getFailInfo/"+PROJECT,function (data){
        var $bca1= $("<td>").text(data.allBuildNumber);
        $bca1.addClass("text-center");
        percent =(data.allBuildNumber ==0)? "NA":Math.round((data.failureNumber/data.allBuildNumber)*100);
        var $bcf1= $("<td>").text(data.failureNumber+"("+percent+"%)");
        $bcf1.addClass("text-center");
        percent =(data.allBuildNumber ==0)? "NA":Math.round((data.abortedNumber/data.allBuildNumber)*100);
        var $bct1= $("<td>").text(data.abortedNumber+"("+percent+"%)");
        $bct1.addClass("text-center");
        $addBrow1.append($bca1);
        $addBrow1.append($bcf1);
        $addBrow1.append($bct1);
        


        var len = data.failBuildName.length;
        for(var i=0;i<len;i++)
        {
            if(data.failBuildNum[i]!=0)
            {
                name =data.failBuildName[i];
                var $hc = $("<td>").text(name);
                $hc.addClass(titleFormat);
                $addHrow.append($hc);
                
                percent =(data.allBuildNumber ==0)? "NA":Math.round((data.failBuildNum[i]/data.allBuildNumber)*100);    
                var $bc3 = $("<td>").text(data.failBuildNum[i]+"("+percent+"%)");
                $bc3.addClass("text-center");
                $addBrow1.append($bc3);
            }
        }
        $tblHead.append($addHrow);
        $tblBody.append($addBrow1);
    })
}

/*This function is used to translate the received CI history result to
  format what we needed to draw the diagram show how many CI each day,
  and how many success CI each day*/
var summaryCIHistory = function(result){

  var summaryJson = {}
  var returnJson = {"days":[],"totalCIs":[],"successCIs":[]}

  result.forEach(function(eachHistory){
      var date = new Date(eachHistory.startTime)
      var ds = date.getFullYear() + '-'+date.getMonth()+'-'+date.getDate()

      if (!summaryJson.hasOwnProperty(ds)){
        summaryJson[ds] = {"totalCI":0,"successCI":0}
      }

      summaryJson[ds].totalCI++

      if(eachHistory.buildResult==="SUCCESS"){
        summaryJson[ds].successCI++
      }
  })

  for(let key in summaryJson){
    returnJson.days.push(key)
    returnJson.totalCIs.push(summaryJson[key].totalCI)
    returnJson.successCIs.push(summaryJson[key].successCI)
  }

  return returnJson

}


var drawDashBoard = function(){

    PROJECT = $('input[name=projectChooseRadio]:checked').val()

    var layout = {
        xaxis: {
        title: 'Build Number'},
        yaxis: {
        title: 'Build Duration(m)'},
        margin: {
        t: 0},
    };
    fetchBuildFInfo();

  /*This get is used to show the total and successful CI times per day,
    it reuse the old get method /jenkins/getCIHistory/, and parse the
    result and generate what we needed by function summaryCIHistory()*/
  $.get("/jenkins/getCIHistory/"+PROJECT,function (result) {
    var parsedResult = summaryCIHistory(result)

    var traceTotalCI = {
      x: parsedResult.days,
      y: parsedResult.totalCIs,
      name: 'total CI times',
      type: 'scatter'
    };

    var traceSuccessCI = {
      x: parsedResult.days,
      y: parsedResult.successCIs,
      name: 'success CI times',
      type: 'scatter'
    };

    var data = [traceTotalCI, traceSuccessCI];

    var layout = {
        xaxis: {
        title: 'day'},
        yaxis: {
        title: 'times'},
        margin: {
        t: 0},
    };

    var plotHandler = document.getElementById('CISummaryPerDay');

    Plotly.newPlot( plotHandler, data,layout)

  })

  $.get("/jenkins/getTheWholeCI/"+PROJECT,function (result) {

    var plotHandler = document.getElementById('theWholeCI');
    Plotly.newPlot( plotHandler, [{
        x: result.id,
        y: result.duration }], layout)

  })

  $.get("/jenkins/getOnTargetBuild/"+PROJECT,function (result) {

    var plotHandler = document.getElementById('onTargetbuild');
    
    Plotly.newPlot( plotHandler, [{
        x: result.id,
        y: result.duration }], layout)

  })  
  
  $.get("/jenkins/getOnTargetTest/"+PROJECT,function (result) {

    var plotHandler = document.getElementById('onTargetTest');
    Plotly.newPlot( plotHandler, [{
        x: result.id,
        y: result.duration }], layout)

  })  
  

  
    $.get("/jenkins/getOffTargetBuild/"+PROJECT,function (result) {

    var plotHandler = document.getElementById('offTargetbuild');
    
    Plotly.newPlot( plotHandler, [{
        x: result.id,
        y: result.duration }], layout)

  })  
  
    $.get("/jenkins/getOffTargetTest/"+PROJECT,function (result) {

    var plotHandler = document.getElementById('offTargetTest');
    
    Plotly.newPlot( plotHandler, [{
        x: result.id,
        y: result.duration }], layout)

  })  
    $.get("/serverInfo/testCaseNum/"+PROJECT,function (result) {
    
    var plotHandler = document.getElementById('testCaseNum');
    var layout = {
        xaxis: {
        title: 'release Number'},
        yaxis: {
        title: 'case number'},
        margin: {
        t: 0},
    };
        Plotly.newPlot( plotHandler, [{
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
    
    Plotly.newPlot( plotHandlerRepoOriginal, repoDataOriginal, layoutRepo);
    Plotly.newPlot( plotHandlerRepoCheckout, repoDataCheckout, layoutRepo);
    Plotly.newPlot( plotHandlerBranch, branchData, layoutBranch);

    // draw pie for repos size before checkout
    var MaxSize = 2048 //2G so far
    var commSize = (reposize.Gitlab_Comm_OriginSize)[reposize.Gitlab_Comm_OriginSize.length-1]
    var cypherSize = (reposize.Gitlab_Cypher_OriginSize)[reposize.Gitlab_Cypher_OriginSize.length-1]
    var bahamaSize = (reposize.Gitlab_Bahama_OriginSize)[reposize.Gitlab_Bahama_OriginSize.length-1]
    var usedSize = commSize + cypherSize + bahamaSize
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

    // draw pies for repos after checkout
    MaxSize = 10240 //10G so far
    commSize = (reposize.Gitlab_Comm_UserSize)[reposize.Gitlab_Comm_UserSize.length-1]
    cypherSize = (reposize.Gitlab_Cypher_UserSize)[reposize.Gitlab_Cypher_UserSize.length-1]
    bahamaSize = (reposize.Gitlab_Bahama_UserSize)[reposize.Gitlab_Bahama_UserSize.length-1]
    usedSize = commSize + cypherSize + bahamaSize
    unusedSize = MaxSize - usedSize;

    data = [{
      values: [usedSize, unusedSize],
      labels: ['used', 'unused'],
      type: 'pie'
      }];

    Plotly.newPlot('userRepoSizePlot', data, layout);

    // draw pie for repo branches counter
    MaxSize = 1000 //1000 branches so far
    commSize = (reposize.Gitlab_Comm_BranchCnt)[reposize.Gitlab_Comm_BranchCnt.length-1]
    cypherSize = (reposize.Gitlab_Cypher_BranchCnt)[reposize.Gitlab_Cypher_BranchCnt.length-1]
    bahamaSize = (reposize.Gitlab_Bahama_BranchCnt)[reposize.Gitlab_Bahama_BranchCnt.length-1]
    usedSize = commSize + cypherSize + bahamaSize
    unusedSize = MaxSize - usedSize;

    data = [{
      values: [usedSize, unusedSize],
      labels: ['used', 'unused'],
      type: 'pie'
      }];

    Plotly.newPlot('repoBrhCntPlot', data, layout);
    })
}

/*durationString is format: '5hours 58minutes'
  return int in hours unit*/
var convertToHours = function(durationString){
  var h,m;

  var split = durationString.split(/\s+/)//split with space, use re to handle in case have more than one space

  h = split[0]
  m = split[1]
  // remove hours and minutes
  h = h.replace('hours','')
  m = m.replace('minutes','')
  // convert to int
  h = parseInt(h)
  m = parseInt(m)

  return (h+m/60).toFixed(2);// keep 2 decimal
}

var commonDashBoard = function(){

  $.get("/bitbucket",function (result) {

    var x = [], y = [];

    result.detail.forEach(function(onePR){

      var duration = convertToHours(onePR.duration)

       //unit is hours, filter out items duration > 100 hours
      if(duration< 100.0){
          x.push(onePR.id)
          y.push(duration)
      }

    })

    var PRDurations = {
      x: x,
      y: y,
      name: 'PR durations',
      type: 'scatter'
    };


    var data = [PRDurations];

    var layout = {
        xaxis: {
        title: 'PR id'},
        yaxis: {
        title: 'hours'},
        margin: {
        t: 0},
    };

    var plotHandler = document.getElementById('PRDurationSummary');

    Plotly.newPlot( plotHandler, data,layout)

  })
}

var main = function(){

    $('input[type=radio][name=projectChooseRadio]').change(function() {
        drawDashBoard()
    });
    commonDashBoard() // draw diagram same with 2.7 and main branch
    drawDashBoard()  // draw diagram different with 2.7 and main branch

}

$(document).ready(main)
