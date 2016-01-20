var stateName = {
  "idleIndex":"&nbsp&nbsp&nbsp&nbspidle&nbsp&nbsp&nbsp&nbsp",
  "precheckIndex":"&nbsppre-check&nbsp&nbsp",  
  "fwbuildIndex":"&nbsp&nbspbuild-fw&nbsp&nbsp",  
  "fwtestIndex":"&nbsp&nbsp&nbsptest-fw&nbsp&nbsp", 
  "win32buildIndex":"build-win32&nbsp",  
  "win32testIndex":"&nbsptest-win32&nbsp",   
  "preRlsIndex":"pre-release&nbsp",    
}
var localCIState = {
  "idle": {}
}

var acquireJenkinsAllInfo = function(){
      try
      {
          $.get("/jenkins/getCurrent", function (result) {
            console.log(result.onTgtTst.duration);
          
        })
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
  
  setInterval(acquireJenkinsAllInfo, 2000);  
};

$(document).ready(main);