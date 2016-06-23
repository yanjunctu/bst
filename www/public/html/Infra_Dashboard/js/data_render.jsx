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
	"buildWin32State": 110,
	"testWin32State": 456,
	"buildFwState": 144,	
	"preReleaseState": 20,
}

var SubmitList = React.createClass ({
    getInitialState: function(){
        return {data:[]};
    },
    
    loadServer: function(){
    	
    	get_ciPending();
    	get_ciStatus();
    	
		//get_theWholeCIduration();
		get_testCaseNum();

		get_getCIHistory(this);
		get_queueStatistics();
    },
    
    setData: function(d){
    	this.setState({data: d});    	
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
        var time;		
		if(item.startTime)
		{
			var t = new Date(item.startTime);
			time = t.toLocaleTimeString("en-US", {month:  "2-digit", day: "2-digit", hour12: false, hour: '2-digit', minute:'2-digit'});
		}
		
		var tag = format_release_tag(item.rlsTag);
		
		return (
                <tr className={item.buildResult} key={i}>
                    <td><i className={resultIconStyles[item.buildResult]}></i></td>
                    <td className={item.buildResult}>{item.buildID}</td>
                    <td>{name}</td>
                    <td>{time}</td>
                    <td>{tag}</td>
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
       
		change_content('#submit_aborted', aborted);
		change_content('#submit_completed', completed);
		change_content('#submit_failed', failed);
		
		change_content('#overall_failure_rate', parseInt(failed/(failed + completed) * 100) + "%");
		change_content('#last30_failure_rate', parseInt(failed_last30/(failed_last30 + completed_last30) * 100) + "%");

		change_content("#testCoverage", testCoverage);
		change_content("#testCaseNum", testCaseNum);

		//document.getElementById('theWholeCIduration').textContent = theWholeCIduration;

		change_content("#queueDuration", queueDuration);
		change_content("#releaseDuration", releaseDuration);
		
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
				p = (ciProgresses[m]/ciEstimation[m] * 100).toFixed(1);
				//console.log(p);
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
						//child.text(p + "%");
						change_obj_content(child, p + "%");					
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
                        <th>St</th>
                        <th>#</th>
                        <th>Submitter</th>
                        <th>Time</th>
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
    <SubmitList url={SubmitListApi} pollInterval={5000} listCount={22}/>,
    document.getElementById('submit_list_tile')
);





var TopSubmitList = React.createClass ({
    getInitialState: function(){
        return {data:[]};
    },
    
    getHeros: function(){
		get_heroes(this);		
    },
    
    setData: function(d){
    	this.setState({data: d});    	
    },    
        
    
    componentDidMount: function(){
		setInterval(this.getHeros,this.props.pollInterval);
    },
    
    renderList:function() {
    	
    	return this.state.data.map((hero, i)=>{
			return (
		        <div className="widget-item hero_box" key={i}>
		            <img className="avatar" src={"avatar/" + getCoreID(hero.name) + ".jpg"}  />
		            <div className="badge badge-green">{hero.XP}</div>                                        
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
    <TopSubmitList url={SubmitListApi} pollInterval={5000} listCount={12}/>,
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

