var exports = module.exports = {};
var exec = require('child_process').exec;




var argsParser=function(args){

    name = "rept-ci"
    email ="rept-ci@googlegroups.com"

    var msg =""
    if(args.msg){
        msg = args.msg
    }
    if (args.mode == 'block'){
        title = '[Notice!] CI is blocked'
    }
    else if (args.mode == 'unblock'){
        title = '[Notice!] CI is unblocked'
        if(!args.msg){
            msg ="You can submit your CI now"
        }
    }    
   
    cmd = "python /opt/booster_project/script/boosterSocket/sendEmail.py -n "+name+" -e "+email+" -m \""+msg+"\" -t "+title
    return cmd
}


var sendMail = function(args){
    cmd = argsParser(args)
    console.log(cmd)
    exec(cmd,function(error,stdout,stderr){
        if(error) {
            console.info('stderr : '+stderr);
        }
    });
}

exports.send= sendMail;