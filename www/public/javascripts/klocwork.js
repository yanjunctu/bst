
var kwTable = $("#kwTbl").DataTable({
        order: [[0, "desc"]],
        columns: [
            {data: "issueID", defaultContent: "--"},
            {data: "rlsTag", defaultContent: "--"},
            {data: "submitter", defaultContent: "--"},
            {data: "time", defaultContent: "--"},
            //{data: "ignore", defaultContent: '<button>cancel</button>'}
            //{data: "ignore", defaultContent: '<i class="fa fa-trash-o" aria-hidden ="true">cancel</i>'}
            //{data: "ignore", defaultContent: '<input type="radio" value="null"></input>'}
            //{data: "ignore", defaultContent: '--'}
          
          
        ],
        //columnDefs: [
         //   {
          //      targets: [4],
          //      data: "ignore",
           //     render: function(data, type, full) {
           //         return "<a href='/Cancel?id=" + data + "'>Cancel</a>"
          //      }
          //  }
        //]
});


var refreshKlocworkInfo = function(kwInfo) {
    kwTable.clear();
    kwTable.rows.add(kwInfo);
    kwTable.draw(false);
};



var acquireKlocworkInfo = function() {

    try
    {
        $.get("/klocwork/getInfo", function(result) {
            refreshKlocworkInfo(result);
        })              
    }
    catch(err)
    {
        console.log(err.message)
    }
};

var main = function()
{

  acquireKlocworkInfo();
    
  var table = $('#kwTbl').DataTable();
 
  $('#kwTbl tbody').on( 'click', 'tr', function () {
        $(this).toggleClass('selected');
    } );
 
    $('#submit_btn_kw').click( function () {
        //alert( table.rows('.selected').data().length +' row(s) selected' );

        //table.rows('.selected').remove().draw( false );
       
       var password = $("#inputPassword_kw").val();
       var msg = ''
       var selectRows = table.rows('.selected').data()
 
        if(selectRows.length == 0){
            msg="no recored select"
        }
        else {
            if (!password){
                
                msg = "please input password"
            }
            else{
                var cancelRecode=[]
                for(var index=0;index<selectRows.length;index++){

                    cancelRecode.push(selectRows[index]["rlsTag"])
                    cancelRecode.push(selectRows[index]["issueID"])

                }
                var cancelInfo = {"recode":cancelRecode,"password":password};
                try{
                    $.post("/klocwork/cancelRecorde", cancelInfo, function(result) {

                        msg = result;
                        if (result == 'SUCCESS'){
                            table.rows('.selected').remove().draw( false );
                        }
                        $("#cancel_status").text(msg);
                        
                    })
                }
                catch(err)
                {
                    msg=err.message
                } 
            } 
        } 

        $("#inputPassword_kw").val("");
        $("#cancel_status").text(msg)
        //return false;
    } );

 
};

$(document).ready(main);
