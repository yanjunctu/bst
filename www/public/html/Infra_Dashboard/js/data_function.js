
function getProjectName()
{
    var search = window.location.search;

    // remove '?'
    search = search.slice(1);
    // extract project name
    var args = search.split('&')
    if (args.length>=1){
        var firstArgPair = args[0].split('=')
        if (firstArgPair[0] === "project"){
            return firstArgPair[1]
        }

    }

}

function formatTime(time_string)
{
	var time;
    if(time_string)
    {
        var t = time_string.split(" ");
        var d = t[0].split("/");
        var h = t[1].split(":");	            
        time = d[0]+"/"+d[1]+" "+h[0]+":"+h[1];
        //console.log(time);
    }
    return time;
}

function getName(name_string)
{
	var name_id;
	var name = name_string;
    if(name_string)
    {
        name_id = name_string.split("-");
        name = name_id[0];

	    if(3 == name_id.length)
	    {
	    	name += name_id[1];
	    }
    }

    return name.replace(/(^\s*)|(\s*$)/g,'');
}

//return NULL if failed
function getCoreID(name_string)
{
	var name_id, name = "NULL";
    if(name_string)
    {
        name_id = name_string.split("-");

        if(name_id.length > 1)
	    {
	    	name = name_id[name_id.length - 1];
	    }
    }
    
    name = name.toUpperCase();
    return name.replace(/(^\s*)|(\s*$)/g,'');
}


function format_release_tag(tag)
{
	var r;
    if(tag)
    {
        var t = tag.split("_");
        if(t.length >1)
        {
        	r = t[1];
        }        
    }
    return r;
}


function change_content(id, val) {                                              
	var obj = $(id); 
	
	if(val != obj.html()){
		obj.fadeOut("slow", function () {
		        obj.html(val);
		    })
			.fadeIn("slow");
	}
}


function change_obj_content(obj, val) {                                              
	if(val != obj.html()){
		obj.fadeOut("slow", function () {
		        obj.html(val);
		    })
			.fadeIn("slow");
	}
}