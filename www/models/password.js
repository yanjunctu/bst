
var exports = module.exports = {};
var fiber = require('fibers');
var Server = require('mongo-sync').Server;



var passwordVerify=function(user,password,callback){
    ret = false
    fiber(function() {
        var server = new Server('127.0.0.1');
        var db = server.db("booster");
        var doc = db.getCollection('booster_password').find({"user": {$eq:user}}).toArray();
        var dbPassword = doc[0]["password"]
        if(password ==dbPassword ){
            ret = true
        }

        callback(ret)
        server.close();
    }).run();
}

exports.verify= passwordVerify;