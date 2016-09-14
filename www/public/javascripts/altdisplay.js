


var INTERVAL = 8000; //8s

var alternateDisplay = function() {
    var $mtric = $("#metric");
    var $dboard = $("#board");
    console.log("display2")
    if($mtric[0].style.display=="block") {
        $mtric[0].style.display="none";
        $dboard[0].style.display="block";
        $("div#metric iframe")[0].src = $("div#metric iframe")[0].src
    }
    else {
        $mtric[0].style.display="block";
        $dboard[0].style.display="none";
        $("div#board iframe")[0].src = $("div#board iframe")[0].src
    }
};

var main = function()
{

  alternateDisplay();
  
  setInterval(alternateDisplay, INTERVAL);  

  
};

$(document).ready(main);

