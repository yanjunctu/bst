var fetchBuildFInfo = function(){
    //$tblBody = $("#emerTbl");
	var $tblHead = $("#infoHead");
	var $tblBody = $("#infobody");
	var name;

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
	    var $bcf1= $("<td>").text(emerald.failureNumber);
		$bcf1.addClass("text-center");
	    var $bct1= $("<td>").text(emerald.abortedNumber);
		$bct1.addClass("text-center");
		$addBrow1.append($bca1);
		$addBrow1.append($bcf1);
		$addBrow1.append($bct1);
		console.log('emerald');
		console.log(emerald);
		
		
	    $.get("/jenkins/getNonEmeraldFailInfo",function (nonEmerald){
			var $bca2= $("<td>").text(nonEmerald.allBuildNumber);
			$bca2.addClass("text-center");
			var $bcf2= $("<td>").text(nonEmerald.failureNumber);
			$bcf2.addClass("text-center");
			var $bct2= $("<td>").text(nonEmerald.abortedNumber);
			$bct2.addClass("text-center");
			$addBrow2.append($bca2);
			$addBrow2.append($bcf2);
			$addBrow2.append($bct2);

			if(nonEmerald.failBuildName!=undefined)
			{
				for(var i=0;i<nonEmerald.failBuildName.length;i++)
				{
					if((nonEmerald.failBuildNum[i]!=0)||(emerald.failBuildNum[i]!=0))
					{
						name =(nonEmerald.failBuildNum[i]!=0)? nonEmerald.failBuildName[i]:emerald.failBuildName[i];
						var $hc = $("<td>").text(name);
						$hc.addClass(titleFormat);
						$addHrow.append($hc);
						
						var $bc3 = $("<td>").text(emerald.failBuildNum[i]);
	                    $bc3.addClass("text-center");
						$addBrow1.append($bc3);
						
						var $bc4 = $("<td>").text(nonEmerald.failBuildNum[i]);
	                    $bc4.addClass("text-center");
						$addBrow2.append($bc4);
					
					}
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
	var layout = {
        xaxis: {
        title: 'Build Number'},
        yaxis: {
        title: 'Build Duaration(m)'},
        margin: {
        t: 0},
    };

    Plotly.plot( plotHandler, [{
        x: result.id,
        y: result.duration }], layout)

  })

  /* Current Plotly.js version */
  
  
  console.log( Plotly.BUILD );
}

$(document).ready(main)