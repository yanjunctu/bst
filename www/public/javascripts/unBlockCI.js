
var PASSWORD = "MotorolaBooster"


var main = function()
{  
    var $subBtn = $("#submit_btn");

    $subBtn.click( function () {
    
        var JenkinsCI = $("#unblock_form input[name='jenkinsCI']:checked").val();
        var boosterDisplay = $("#unblock_form input[name='boosterdisplay']:checked").val();

        var password = $("#unblock_form input[id='inputPassword']").val();
        var msg = ''
 
        console.log(JenkinsCI)
        console.log(boosterDisplay)
        console.log(password)
        if(JenkinsCI == undefined && boosterDisplay == undefined){
            msg="Please choose at least one component to unblock"
        }
        else {
            if (password == PASSWORD){
                var unblockInfo = {"jenkinsCI":JenkinsCI, "boosterdisplay":boosterDisplay};
                console.log(unblockInfo)
                try{
                    $.post("/jenkins/doUnblockCI", unblockInfo, function (result) {
                        
                        msg = result
                        console.log("result:"+msg)
                        $("#unblock_status").text(msg)

                    })
                }
                catch(err)
                {
                    msg=err.message
                } 
            }
            else{
                msg = "Invalid password"
            } 
        } 

        $("#unblock_form input[type='checkbox']").attr("checked",false)
        $("#unblock_form input[id='inputPassword']").val("");
        $("#unblock_status").text(msg)
        return false;
                 
    })
}
      
$(document).ready(main)