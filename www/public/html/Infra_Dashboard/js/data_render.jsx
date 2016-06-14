'use strict';

//icon style for history data
var resultIconStyles = {
	"QUEUING": "fa fa-clock-o fa-1x fa-fw",
	"RUNNING": "fa fa-refresh fa-spin fa-1x fa-fw",
	"ABORTED": "fa fa-exclamation fa-1x fa-fw",
	"SUCCESS": "fa fa-check fa-1x fa-fw",
	"FAILURE": "fa fa-close fa-1x fa-fw",
}

//progress of each steps, percentage, 0 - 100 
var ciProgresses = {
	"preCheckState": 0,
	"buildWin32State": 0,
	"testWin32State": 0,
	"buildFwState": 0,	
	"preReleaseState": 0,
}

//estimated duration for each step, ticks by 5 sec interval
var ciEstimation = {
	"preCheckState": 60,
	"buildWin32State": 60,
	"testWin32State": 456,
	"buildFwState": 115,	
	"preReleaseState": 20,
}

var SubmitList = React.createClass ({
    getInitialState: function(){
        return {data:[]};
    },
    
    loadServer: function(){
    	
    	get_ciPending();
    	get_ciStatus();
    	
		get_theWholeCIduration();
		get_testCaseNum();

        $.ajax({
            url: this.props.url,
            dataType:'json',
            success: function(data){
                if (data != null) {

                    CIHistory = eval(data);
                    CIHistory.reverse();

					//todo: move the code to a better place.
					get_testCoverage();
					get_heroes();
					
					//add running & queuing task
					if(CIPendingReq.current)
					{
						CIPendingReq.current.buildResult = "RUNNING";
						if(CIPendingReq.current.submitter != "na")
						{
							CIHistory.unshift(CIPendingReq.current);
						}
					}

					for (var i=0;i<CIPendingReq.queue.length;i++)
					{
						CIPendingReq.queue[i].buildResult = "QUEUING";
						CIHistory.unshift(CIPendingReq.queue[i]);
					}
					//
										
					this.setState({data: CIHistory.slice(0, this.props.listCount)});
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
        	this.setState({data: CIHistory.slice(0, this.props.listCount)});

			get_testCoverage();
			//get_heroes();
			
        	setInterval(this.render,this.props.pollInterval);
        }
        
    },
    
    renderTbody: function() {
        return this.state.data.map((item, i)=>{
			
		//just remove core id
        var name = getName(item.submitter);
        
        //format date time
        var time = formatTime(item.rlsTime);


		return (
                <tr className={item.buildResult} key={i}>
                    <td><i className={resultIconStyles[item.buildResult]}></i></td>
                    <td className={item.buildResult}>{item.buildID}</td>
                    <td>{name}</td>
                    <td>{time}</td>
                    <td>{item.rlsTag}</td>
                </tr>
            );
        });

    },

    render:function() {
    	
    	//put here at initial release, better optimized;
    	//console.log("render...");
    	
    	var completed = 0;
    	var failed = 0;
    	var aborted = 0;
    	var failed_last30 = 0;
    	var completed_last30 = 0;
    	
		CIHistory.map((item, i)=>{
            if (item.buildResult == "ABORTED") {
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
       });
       
		document.getElementById('submit_aborted').textContent = aborted;
		document.getElementById('submit_completed').textContent = completed;
		document.getElementById('submit_failed').textContent = failed;

		document.getElementById('overall_failure_rate').textContent = parseInt(failed/(failed + completed) * 100) + "%";
		document.getElementById('last30_failure_rate').textContent = parseInt(failed_last30/(failed_last30 + completed_last30) * 100) + "%";
		
		document.getElementById('testCoverage').textContent = testCoverage;
		document.getElementById('testCaseNum').textContent = testCaseNum;
		document.getElementById('theWholeCIduration').textContent = theWholeCIduration;

		//
		var mtag;
		for(var m in CIStatus)
		{
			mtag = '#' + m;
			
			//block info
			if(m == "ciBlockInfo")
			{	
				//console.log(JSON.stringify(CIStatus[m]));
				if(CIStatus[m]["result"] == "FAILURE")
				{
					for(var bi in CIStatus[m] )
					{
						$("#"+m+"_"+bi).text(CIStatus[m][bi]);
					}
					$(mtag).removeClass("hidden");
				}
				else
				{
					$(mtag).addClass("hidden");						
				}
				continue;
			}
			else if(m == "overall")
			{
				//do nothing
				continue;
			}
			
			//step progress
			var p = -1;
			if(CIStatus[m].status == "done")
			{
				p = 100;
			}
			else if(CIStatus[m].status == "running")
			{
				//simulate progress update before get real progress from server
				ciProgresses[m] += ciProgresses[m] < ciEstimation[m] * 0.95 ? 1 : 0;
				p = parseInt(ciProgresses[m]/ciEstimation[m] * 100);
			}
			else if(CIStatus[m].status == "not start")
			{
				ciProgresses[m] = 0;
				p = 0;
			}

			if($(mtag))
			{
				if(p != -1)
				{
					$(mtag).css("width", p + "%");
					var child = $(mtag+">*:nth-child(2)");
					if(CIStatus[m].status == "not start")
					{
						child.text("");
					}
					else
					{
						child.text(p + "%");
					}
				}
				
			}

		}
		
				
		//temp code finished
		
        return (
            <div className="table-responsive">
                <table className="table">
                    <tbody>
                    <tr className="TITILE">
                        <th></th>
                        <th>#</th>
                        <th>Submitter</th>
                        <th>Finish</th>
                        <th>Tag</th>
                    </tr>
                    {this.renderTbody()}
                    </tbody>
                </table>
            </div>
        );
    },
    
});


var SubmitListApi;
SubmitListApi = hostname + "/jenkins/getCIHistory";
ReactDOM.render(
    <SubmitList url={SubmitListApi} pollInterval={5000} listCount={15}/>,
    document.getElementById('submit_list_tile')
);





var TopSubmitList = React.createClass ({
    getInitialState: function(){
        return {data:heroes};
    },
    
    getHeros: function(){
		get_heroes();
		this.setState({data: heroes});
    },
    
    componentDidMount: function(){
		setInterval(this.getHeros,this.props.pollInterval);
    },
    
    renderList:function() {
    	
    	return this.state.data.map((hero, i)=>{
			return (
		        <div className="widget-item" key={i}>
		            <img className="avatar" src={"avatar/" + getCoreID(hero.name) + ".jpg"}  />
		            <div className="badge badge-danger">{hero.XP}</div>                                        
		            <div className="widget-subtitle">{getName(hero.name)}</div>
		        </div>
	            );
        });
    },
    
    render:function() {
		return (
	        <div>
	            {this.renderList()}
	        </div>
            );
    },
});

ReactDOM.render(
    <TopSubmitList url={SubmitListApi} pollInterval={5000} listCount={15}/>,
    document.getElementById('top_submiter_list')
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
