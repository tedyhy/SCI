var request = require("request"),
    async = require('async');

/**
 * Remove a component from the registry
 * @param {Object} component  component信息，必须包括name、version  || version为all时则全部删除
 * @param {Object} options  命令行参数
 * @param {Function} callback  回调函数，接受error,message两个参数
 */
module.exports = function(component, options, callback){

    var auth = this.conf.getConf("_auth"),
        username = this.conf.getConf("username");

    if(username && auth){
        var user = {
                name : username,
                _auth : auth
            },
            postBody = {
                user : user,
                component : component,
                options : options
            },
            rand = Math.floor(Math.random()*100000000).toString(),
            validate_url = this.url + "unpublish_auth?hash=" + rand,
            unpublish_url = this.url + "unpublish?hash=" + rand,
            validate_requestOption = {
                url : validate_url,
                method : "POST",
                json : postBody
            },
            unpublish_requestOption = {
                url : unpublish_url,
                method : "POST",
                json : postBody
            };
        request(validate_requestOption, function(error, res, body){
            if(error){
                callback(error);
            }else{
                if(res.statusCode == 200){
                    request(unpublish_requestOption, function(error, res, body){
                        if(error){
                            callback(error);
                        }else{
                            if(res.statusCode == 200){
                                callback(null, body);
                            }else{
                                callback(error);
                            }
                        }
                    });
                }else{
                    callback(body);
                }
            }
        });

    }else{
        callback(__("Must adduser first!"));
    }
};
