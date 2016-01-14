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
          $.post("/feedbackItem", newFeedBack, function (result) {
          
        })
      }
      catch(err)
      {
        alert(err.message)
      }
  });  
};

$(document).ready(main);