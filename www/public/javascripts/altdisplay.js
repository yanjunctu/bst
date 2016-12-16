


var INTERVAL = 8000; //8s

var iFrames = {curIndex:0,// in order to show board27 firstly, so set initialize value to 2
               boards:["#boardMain","#metric"]
              };

var alternateDisplay = function() {
    // mask last frame
    $(iFrames.boards[iFrames.curIndex])[0].style.display = "none"
    // reload the frame
    sel = iFrames.boards[iFrames.curIndex]+" iframe";
    
    if(iFrames.boards[iFrames.curIndex] == "#metric" ){
      $(sel)[0].src=$(sel)[0].src  
    }
    // increase index number
    iFrames.curIndex = (iFrames.curIndex+1)%iFrames.boards.length;
    // show next frame
    $(iFrames.boards[iFrames.curIndex])[0].style.display = "block"
};

var main = function()
{

  alternateDisplay();
  
  setInterval(alternateDisplay, INTERVAL);  

  
};

$(document).ready(main);

