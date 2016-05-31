'use strict';



var SubmitList = React.createClass ({
    getInitialState: function(){
        return {data:[]};
    },
    loadServer: function(){
   		console.log("loading server...");  
        $.ajax({
            url: this.props.url,
            dataType:'json',
            success: function(data){
                if (data != null) {
                    data.splice(16,3);
                    this.setState({data: data});
                }

            }.bind(this),
            error: function(xhr,status,err){
                console.log(this.props.url,status,err.toString());
            }.bind(this)
        });
    },
    componentDidMount: function(){
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
        return this.state.data.map((item, i)=>{
            var statusStyle = {backgroundColor: "lightskyblue", fontSize: "27px", color: "black"};
/*            if (item.status == "pending") {
                statusStyle = {backgroundColor: "sandybrown", fontSize: "27px", color: "black"};
            }*/

            if (item.status == "ABORTED") {
                statusStyle = {backgroundColor: "lightskyblue", fontSize: "27px", color: "black"};
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
var SubmitListApi = "";
ReactDOM.render(
    <SubmitList url={SubmitListApi} pollInterval={5000}/>,
    document.getElementById('submit_list_tile')
);

