var main = function(){
  
  // Can't use jquery selection format $("#onbuild"), otherwise plot will not work
  // so far not find the root cause
  var plotHandler = document.getElementById('onbuild');

  Plotly.plot( plotHandler, [{
      x: [1, 2, 3, 4, 5],
      y: [1, 2, 4, 8, 16] }], { 
      margin: { t: 0 } } );

  plotHandler = document.getElementById('ontest');

  Plotly.plot( plotHandler, [{
      x: [1, 2, 3, 4, 5],
      y: [1, 2, 4, 8, 16] }], { 
      margin: { t: 0 } } );
  
  plotHandler = document.getElementById('offbuild');

  Plotly.plot( plotHandler, [{
      x: [1, 2, 3, 4, 5],
      y: [1, 2, 4, 8, 16] }], { 
      margin: { t: 0 } } );

  plotHandler = document.getElementById('offtest');

  Plotly.plot( plotHandler, [{
      x: [1, 2, 3, 4, 5],
      y: [1, 2, 4, 8, 16] }], { 
      margin: { t: 0 } } );
  
  /* Current Plotly.js version */
  console.log( Plotly.BUILD );
  
}

$(document).ready(main)