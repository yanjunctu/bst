var indexArray = ["idleState","preCheckState","buildFwState","testFwState","buildWin32State","testWin32State","preReleaseState"];
var statusArray = ["not start","running","done"]
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
      //console.log(key);
      
      var sel = ".tab-pane.active a."+key;
      //console.log($(sel))
     
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

var acquireJenkinsAllInfo = function(){
      try
      {
          var whichCI=undefined;
          var id = $(".tab-pane.active").attr("id");
          if (id == "ciTabEmer")
            whichCI = "emerald" 
          else if (id == "ciTabNonEmer")
            whichCI = "nonEmerald"     
          if (whichCI!=undefined)
          {
              $.get("/jenkins/getCurrentStatus",{"whichCI":whichCI},function (result) {
                refreshCi(result);
              
            })
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
  
  setInterval(acquireJenkinsAllInfo, 5000);  
};

$(document).ready(main);