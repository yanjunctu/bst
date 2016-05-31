'use strict';



var SubmitList = React.createClass ({
    getInitialState: function(){
        return {data:[]};
    },
    loadServer: function(){
    	
    	ciPending();
    	ciStatus();
    	
    	
        $.ajax({
            url: this.props.url,
            dataType:'json',
            success: function(data){
                if (data != null) {

                    CIHistory = eval(data);
                    CIHistory.reverse();

					//todo: move.
					//add running & queuing task
					if(CIPendingReq.current)
					{
						CIPendingReq.current.buildResult = "RUNNING";
						CIHistory.unshift(CIPendingReq.current);					
					}

					for (var i=0;i<CIPendingReq.queue.length;i++)
					{
						CIPendingReq.queue[i].buildResult = "QUEUING";
						CIHistory.unshift(CIPendingReq.queue[i]);
					}
					//
										
					this.setState({data: CIHistory.slice(0,15)});
                }
            }.bind(this),
            error: function(xhr,status,err){
                console.log(this.props.url,status,err.toString());
            }.bind(this)
        }); 
    },
    componentDidMount: function(){
    	console.log("request: " + this.props.url); 
        if(this.props.url != "")
        {
	        this.loadServer();
	        setInterval(this.loadServer,this.props.pollInterval);        	
        }
        else
        {
        	CIHistory.reverse();
        	this.setState({data: CIHistory.slice(0, 15)});        	
        }
        
    },
    
    renderTbody() {
         
        
        var history_data = this.state.data.map((item, i)=>{
            var statusStyle = {backgroundColor: "lightskyblue", fontSize: "27px", color: "black"};
            if (item.buildResult == "QUEUING") {
                statusStyle = {backgroundColor: "sandybrown", fontSize: "27px", color: "black"};
            }

            if (item.buildResult == "ABORTED") {
                statusStyle = {backgroundColor: "lightgrey", fontSize: "27px", color: "black"};
            }

            if (item.buildResult == "SUCCESS") {
                statusStyle = {backgroundColor: "#8bbc21", fontSize: "27px", color: "black"};
            }

            if (item.buildResult == "FAILURE") {
                statusStyle = {backgroundColor: "#A42823", fontSize: "27px", color: "black"};
            }
            
            var name = item.submitter.split("-");
            var time = "";
            if(item.rlsTime)
    	    {
	            var t = item.rlsTime.split(" ");
	            time = t[1];
	            //console.log(item.rlsTime);
            }

            
            return (
                <tr style={statusStyle} key={i}>
                    <td><strong>{item.buildID}</strong></td>
                    <td><strong>{item.buildResult}</strong></td>
                    <td><strong>{name[0]}</strong></td>
                    <td><strong>{time}</strong></td>
                    <td><strong>{item.coverage}</strong></td>
                    <td><strong>{item.rlsTag}</strong></td>
                </tr>
            );
        })
        
        
        return history_data;
    },

    render() {
    	
    	//put here at initial release, better optimized;
    	var completed = 0;
    	var failed = 0;
    	var aborted = 0;
    	var failed_last30 = 0;
    	var completed_last30 = 0;
    	
		CIHistory.map((item, i)=>{
            if (item.status == "ABORTED") {
                aborted += 1;            
            }
			else if (item.buildResult == "SUCCESS") {
                completed += 1;
               	if (i < 30) {
               		completed_last30 += 1;
               	}                
            }
            else if (item.buildResult == "FAILURE") {
                failed += 1;
               	if (i < 30) {
               		failed_last30 += 1;
               	}                 
            }
        })
		document.getElementById('submit_aborted').textContent = aborted;
		document.getElementById('submit_completed').textContent = completed;
		document.getElementById('submit_failed').textContent = failed;

		document.getElementById('overall_failure_rate').textContent = parseInt(failed/(failed + completed) * 100);
		document.getElementById('last30_failure_rate').textContent = parseInt(failed_last30/(failed_last30 + completed_last30) * 100);

		var a = $('rel');//.innerText = "abc";
		a.text("aa");
		console.log(JSON.stringify(a));


		//temp code finished
		
        return (
            <div className="table-responsive">
                <table className="table">
                    <tbody>
                    <tr style={{fontSize: "27px"}}>
                        <th width="5%">Build</th>
                        <th width="15%">Status</th>
                        <th width="20%">Submitter</th>
                        <th width="10%">Finish</th>
                        <th width="10%">Coverage</th>
                        <th width="40%">Tag</th>
                    </tr>
                    {this.renderTbody()}
                    </tbody>
                </table>
            </div>
        );
    }
    
});



//var SubmitListApi = hostname + "/api/metrics/gated_test/submit_list_tile";
var SubmitListApi = hostname + "/jenkins/getCIHistory";
ReactDOM.render(
    <SubmitList url={SubmitListApi} pollInterval={5000}/>,
    document.getElementById('submit_list_tile')
);

