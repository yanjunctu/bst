var indexArray = ["idleState","preCheckState","buildFwState","testFwState","buildWin32State","testWin32State","preReleaseState"];
var statusArray = ["not start","running","done"]
var GET_JENKINS_INTERVAL = 15000;// each 15 seconds to get a jenkins status
var CIStateLookup = {
  "idleState": {
    "icon":{
      "not start":"fa fa-coffee fa-lg",
      "running":"fa fa-refresh fa-spin fa-lg",
      "done":"fa fa-coffee fa-lg"
    },
    "btn":{
      "not start":"btn btn-md btn-default",
      "running":"btn btn-md btn-success",
      "done":"btn btn-md btn-primary"      
    },
    "curIcon":"fa fa-coffee fa-lg",
    "curBtn":"btn btn-md btn-default"
  },
  "preCheckState": {
    "icon":{
      "not start":"fa fa-download fa-lg",
      "running":"fa fa-refresh fa-spin fa-lg",
      "done":"fa fa-download fa-lg"
    },
    "btn":{
      "not start":"btn btn-md btn-default",
      "running":"btn btn-md btn-success",
      "done":"btn btn-md btn-primary"      
    },
    "curIcon":"fa fa-download fa-lg",
    "curBtn":"btn btn-md btn-default"    
  },  
  "buildFwState": {
    "icon":{
      "not start":"fa fa-building fa-lg",
      "running":"fa fa-refresh fa-spin fa-lg",
      "done":"fa fa-building fa-lg"
    },
    "btn":{
      "not start":"btn btn-md btn-default",
      "running":"btn btn-md btn-success",
      "done":"btn btn-md btn-primary"      
    },
    "curIcon":"fa fa-building fa-lg",
    "curBtn":"btn btn-md btn-default"        
  },
  "testFwState": {
    "icon":{
      "not start":"fa fa-flask fa-lg",
      "running":"fa fa-refresh fa-spin fa-lg",
      "done":"fa fa-flask fa-lg"
    },
    "btn":{
      "not start":"btn btn-md btn-default",
      "running":"btn btn-md btn-success",
      "done":"btn btn-md btn-primary"      
    },
    "curIcon":"fa fa-flask fa-lg",
    "curBtn":"btn btn-md btn-default"       
  },
  "buildWin32State": {
    "icon":{
      "not start":"fa fa-building fa-lg",
      "running":"fa fa-refresh fa-spin fa-lg",
      "done":"fa fa-building fa-lg"
    },
    "btn":{
      "not start":"btn btn-md btn-default",
      "running":"btn btn-md btn-success",
      "done":"btn btn-md btn-primary"      
    },
    "curIcon":"fa fa-building fa-lg",
    "curBtn":"btn btn-md btn-default"        
  },
  "testWin32State": {
    "icon":{
      "not start":"fa fa-flask fa-lg",
      "running":"fa fa-refresh fa-spin fa-lg",
      "done":"fa fa-flask fa-lg"
    },
    "btn":{
      "not start":"btn btn-md btn-default",
      "running":"btn btn-md btn-success",
      "done":"btn btn-md btn-primary"      
    },
    "curIcon":"fa fa-flask fa-lg",
    "curBtn":"btn btn-md btn-default"         
  },
  "preReleaseState": {
    "icon":{
      "not start":"fa fa-check-square-o fa-lg",
      "running":"fa fa-refresh fa-spin fa-lg",
      "done":"fa fa-check-square-o fa-lg"
    },
    "btn":{
      "not start":"btn btn-md btn-default",
      "running":"btn btn-md btn-success",
      "done":"btn btn-md btn-primary"      
    },
    "curIcon":"fa fa-check-square-o fa-lg",
    "curBtn":"btn btn-md btn-default"        
  },
};


var refreshCi = function(status)
{
  console.log(status);
  $.each(status,function(i){
    var key = i;
    var value = status[i];
    
    if (-1 != $.inArray(key,indexArray) && -1 != $.inArray(value.status,statusArray))
    {
      sel = ".tab-pane.active a."+key;
      
      $(sel).removeClass(CIStateLookup[key].curBtn);
      CIStateLookup[key].curBtn = CIStateLookup[key].btn[value.status];
      $(sel).addClass(CIStateLookup[key].curBtn);
      
      sel = ".tab-pane.active a."+key+" i";
      $(sel).removeClass(CIStateLookup[key].curIcon);
      CIStateLookup[key].curIcon = CIStateLookup[key].icon[value.status];
      $(sel).addClass(CIStateLookup[key].curIcon);  
      
      sel = ".tab-pane.active a."+key+" .statusStr";
      //console.log($(sel));
      $(sel).text(value.status);
      
      
    }
    
  });
};


var refreshQ = function(QueueInfo)
{
  console.log(QueueInfo);
  
  var $tblBody = undefined;
  
  //clear old tables
  if($(".tab-pane.active").attr("id")=="ciTabEmer"){
    console.log("empty emer")
    $tblBody = $("#emerTbl");
    $tblBody.empty()
  }
  else if($(".tab-pane.active").attr("id")=="ciTabNonEmer"){
  $tblBody = $("#nonEmerTbl");
  $tblBody.empty()  
  }
  
  //create running CI row info
  $c1 = $("<td>").text("running CI");
  $c1.addClass("text-center");
  $c2 = $("<td>").text(QueueInfo.current.submitter)
  $c2.addClass("text-center");  
  
  var utcSeconds = parseInt(QueueInfo.current.subTime);
  
  if (!isNaN(utcSeconds)){
    var d = new Date(utcSeconds);
    var n = d.toLocaleTimeString();      
    $c3 = $("<td>").text(n)
    $c3.addClass("text-center");    
  }
  else{
    $c3 = $("<td>").text("na")
    $c3.addClass("text-center");    
  }     
  
  $addrow = $("<tr>");
  $addrow.append($c1)
  $addrow.append($c2)
  $addrow.append($c3)
  $tblBody.append($addrow)
  
  //create pending row info
  $.each(QueueInfo.queue,function(index,value){
    var displayIndex = index+1;
    $c1 = $("<td>").text("pending CI "+displayIndex);
    $c1.addClass("text-center");
    $c2 = $("<td>").text(value.submitter);
    $c2.addClass("text-center");
    
    var utcSeconds = parseInt(value.subTime);
    
    if (!isNaN(utcSeconds)){
      var d = new Date(utcSeconds);
      var n = d.toLocaleTimeString();      
      $c3 = $("<td>").text(n)
      $c3.addClass("text-center");
    }
    else{
      $c3 = $("<td>").text("na")
      $c3.addClass("text-center");      
    }     
    
    $addrow = $("<tr>");
    $addrow.append($c1)
    $addrow.append($c2)
    $addrow.append($c3)
    $tblBody.append($addrow)
    
  });
};
var acquireJenkinsAllInfo = function(){
      try
      {
          var whichCI=undefined;
          var id = $(".tab-pane.active").attr("id");
          console.log(id);
          if (id == "ciTabEmer")
          {
              $.get("/jenkins/getEmerStatus",function (result) {
                refreshCi(result);
              
            })
            
              $.get("/jenkins/getEmerPendingReq",function (result) {
                refreshQ(result);
              
            })   
          }
          else if (id == "ciTabNonEmer")
          {
              $.get("/jenkins/getNonEmerStatus",function (result) {
                refreshCi(result);
              
            })
            
              $.get("/jenkins/getNonEmerPendingReq",function (result) {
                refreshQ(result);
              
            })    
            //result = {"current":{"submitter":"JunJun","subTime":1456127340000},"queue":[{"submitter":"JunJun1","subTime":1456127340000},{"submitter":"JunJun2","subTime":1456127340000},{"submitter":"JunJun3","subTime":1456127340000}]}            
            //refreshQ(result);
          }            

          
      }
      catch(err)
      {
        console.log(err.message)
      }
      
};

var main = function()
{
  var $subBtn = $("#submit_btn");
   
  $subBtn.click( function () {
      
      var feedback_rateOfGit = $("#feedback_form input[type='radio']:checked").val();
      var feedback_advise = $("#comment").val()
      var feedback_coreid = $("#Feedback_coreId").val()
     
     if(typeof feedback_rateOfGit == "undefined"){
          $("#feedback_status").text("Please choose your opinion of our service at least:-)");
          return false;
      }
      var newFeedBack = {"rateOfGit":feedback_rateOfGit, "selfAdvise":feedback_advise, "coreid":feedback_coreid};

      try
      {
          $.post("/feedback/gitnew", newFeedBack, function (result) {
          
        })
      }
      catch(err)
      {
        alert(err.message)
      }
      
      $("#comment").val("")
      $("#feedback_form input[type='radio']").attr("checked",false)
      $("#Feedback_coreId").val("")
      $("#feedback_status").text("Thanks for your feedback")
      
      return false;
  });  
  
  $('.nav.nav-tabs').bind('click', function(event) {
      setTimeout(acquireJenkinsAllInfo, 0);
  });  
  
  $(".testFwState").hide();
  acquireJenkinsAllInfo();
  
  setInterval(acquireJenkinsAllInfo, GET_JENKINS_INTERVAL);  
};

$(document).ready(main);