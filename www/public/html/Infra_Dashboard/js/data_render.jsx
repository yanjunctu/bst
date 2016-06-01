'use strict';
var resultIconStyles = {
	"QUEUING": "fa fa-cog fa-spin fa-1x fa-fw",
	"ABORTED": "fa fa-exclamation fa-1x fa-fw",
	"SUCCESS": "fa fa-check fa-1x fa-fw",
	"FAILURE": "fa fa-close fa-1x fa-fw",
}
var ciProgresses = {
	"preCheckState": 0,
	"buildWin32State": 0,
	"testWin32State": 0,
	"buildFwState": 0,	
	"preReleaseState": 0,
}

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
        if(this.props.url)
        {
	        this.loadServer();
	        setInterval(this.loadServer,this.props.pollInterval);        	
        }
        else
        {
        	CIHistory.reverse();
        	this.setState({data: CIHistory.slice(0, 15)});

        	setInterval(this.render,this.props.pollInterval);
        }
        
    },
    
    renderTbody() {
         
        
        var history_data = this.state.data.map((item, i)=>{
			
			//just remove core id
            var name = item.submitter.split("-");
            
            //format date time
            var time = "";
            if(item.rlsTime)
    	    {
	            var t = item.rlsTime.split(" ");
	            var d = t[0].split("/");
	            var h = t[1].split(":");	            
	            time = d[0]+"/"+d[1]+" "+h[0]+":"+h[1];
	            console.log(time);
            }
/*
<td>
	<div className="progress progress-striped active">
		<div id="preReleaseState" className="progress-bar progress-bar-success" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100">
			<div className="progress_text otto2">Release</div>			
		</div>
	</div>
</td>


             <tr className={item.buildResult} key={i}>
                    <td>{item.buildID}</td>
                    <td><i className={resultIconStyles[item.buildResult]}></i></td>
                    <td>{name[0]}</td>
                    <td>{time}</td>
                    <td>{item.coverage}</td>
                    <td>{item.rlsTag}</td>
                </tr>*/
		return (
                <tr className={item.buildResult} key={i}>
                    <td>{item.buildID}</td>
                    <td><i className={resultIconStyles[item.buildResult]}></i></td>
                    <td>{name[0]}</td>
                    <td>{time}</td>
                    <td>{item.coverage}</td>
                    <td>{item.rlsTag}</td>
                </tr>
            );
        })
        
        
        return history_data;
    },

    render() {
    	
    	//put here at initial release, better optimized;
    	console.log("render...");
    	
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

		document.getElementById('overall_failure_rate').textContent = parseInt(failed/(failed + completed) * 100) + "%";
		document.getElementById('last30_failure_rate').textContent = parseInt(failed_last30/(failed_last30 + completed_last30) * 100) + "%";

		//
		var mtag;
		for(var m in CIStatus)
		{
			mtag = '#' + m; 
			if(CIStatus[m].status == "done")
			{
				ciProgresses[m] = 100;
			}
			else if(CIStatus[m].status == "running")
			{
				//simulate progress update before get real progress from server
				ciProgresses[m] += ciProgresses[m] < 95? 1 : 0;
			}
			else if(CIStatus[m].status == "not start")
			{
				ciProgresses[m] = 0;
			}
			
			$(mtag).css("width", ciProgresses[m] + "%");
		}
		
				
		//temp code finished
		
        return (
            <div className="table-responsive">
                <table className="table">
                    <tbody>
                    <tr className="TITILE">
                        <th>Build</th>
                        <th>Result</th>
                        <th>Submitter</th>
                        <th>Finish</th>
                        <th>Coverage</th>
                        <th>Tag</th>
                    </tr>
                    {this.renderTbody()}
                    </tbody>
                </table>
            </div>
        );
    }
    
});



var SubmitListApi;
//SubmitListApi = hostname + "/jenkins/getCIHistory";
ReactDOM.render(
    <SubmitList url={SubmitListApi} pollInterval={5000}/>,
    document.getElementById('submit_list_tile')
);




function set_toggle(){
	var toggle = false;
	$(document).on('keyup', function(evt) {
		if (evt.keyCode == 122) {
			if (toggle == true) {
				$('html, body').css('overflow-y', 'auto');
			} else {
				$('html, body').css('overflow-y', 'hidden');
			}
			toggle = !toggle;					
		}
	});
}

set_toggle();

