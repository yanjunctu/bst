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

function getCoreID(name_string)
{
	var name_id, name = name_string;
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