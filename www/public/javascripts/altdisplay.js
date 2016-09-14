


var INTERVAL = 8000; //8s

var alternateDisplay = function() {
    var $mtric = $("#metric");
    var $dboard = $("#board");
    console.log("display2")
    if($mtric[0].style.display=="block") {
        $mtric[0].style.display="none";
        $dboard[0].style.display="block";}
    else {
        $mtric[0].style.display="block";
        $dboard[0].style.display="none";
    }
    $mtric.src = $mtric.src
    $dboard.src = $dboard.src
};

var main = function()
{

  alternateDisplay();
  
  setInterval(alternateDisplay, INTERVAL);  

  
};

$(document).ready(main);

