var request = require('request');

/**
 * Manage component owners
 * @param op_type
 * @param component {Object} component信息，必须包括name、version
 * @param options   {Object} 命令行输入的参数
 * @param callback  {Function}  回调函数，接受error,message两个参数
 */
module.exports = function(op_type, component, options, callback){

    var rand = Math.floor(Math.random()*100000000).toString(),
        url = this.url + "owner_" + op_type + "?hash=" + rand,
        requestOption = {
            url : url,
            method : "POST"
        };

    switch(op_type){
        case "ls":
            requestOption.json = {
                component : component
            };
            break;
        case "rm":
        case "add":
            var auth = this.conf.getConf("_auth"),
                username = this.conf.getConf("username");

            if(username && auth){
                var user = {
                    name : username,
                    _auth : auth
                };
                requestOption.json = {
                    user : user,
                    component : component,
                    options : options
                };
            }else{
                callback(__("You must adduser first!"));
            }
            break;
    }

    request(requestOption, function(error, res, body){
        if(error){
            callback(error);
        }else{
            if(res.statusCode == 200){
                callback(null, body);
            }else{
                callback(body);
            }
        }
    });

};
