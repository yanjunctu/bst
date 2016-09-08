
var main = function()
{  
    var $subBtn = $("#submit_btn");

    $subBtn.click( function () {
    
        var JenkinsCI = $("#unblock_form input[name='jenkinsCI']:checked").val();
        var boosterDisplay = $("#unblock_form input[name='boosterdisplay']:checked").val();
        var project = $('input[name=projectChooseRadio]:checked').val()

        var password = $("#unblock_form input[id='inputPassword']").val();
        var msg = ''
 
        if(JenkinsCI == undefined && boosterDisplay == undefined){
            msg="Please choose at least one component to unblock"
        }
        else {
            if (!password){
                
                msg = "please input password"
            }
            else{
                var unblockInfo = {"jenkinsCI":JenkinsCI, "boosterdisplay":boosterDisplay,"project":project,"password":password};
                try{
                    $.post("/jenkins/doUnblockCI", unblockInfo, function (result) {    
                        msg = result
                        $("#unblock_status").text(msg)

                    })
                }
                catch(err)
                {
                    msg=err.message
                } 
            } 
        } 

        $("#unblock_form input[type='checkbox']").attr("checked",false)
        $("#unblock_form input[id='inputPassword']").val("");
        $("#unblock_status").text(msg)
        return false;
                 
    })
}
      
$(document).ready(main)