var exports = module.exports = {};
var exec = require('child_process').exec;




var argsParser=function(args){

    name = "rept-ci"
    email ="rept-ci@googlegroups.com"

    var msg =""
    if (args.mode == 'block'){
        subject = '[Notice!] CI is blocked'
    }
    else if (args.mode == 'unblock'){
        subject = '[Notice!] CI is unblocked'
        msg ="You can submit your CI now"
    }
    if(args.msg){
        msg = args.msg
    }
    if(args.subject){
        subject = args.subject
    }
    if(args.email){
        email = args.email
        name = email.split("@")[0]
    }
    if(args.name){
        name = args.name
    }
    cmd = "python /opt/booster_project/script/boosterSocket/sendEmail.py -n "+name+" -e "+email+" -m \""+msg+"\" -s "+subject
    
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