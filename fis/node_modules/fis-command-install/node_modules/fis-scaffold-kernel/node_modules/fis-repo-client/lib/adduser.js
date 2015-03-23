var Base64 = require('js-base64').Base64,
    request = require('request');
/**
 * Create or verify a user named <username> in the registry, and save the credentials to the .fisrc file.
 * @param {String} username
 * @param {String} password
 * @param {String} email
 * @param {Function} cb 回调函数，接受error,message两个参数
 */
module.exports = function(username, password, email, cb){
    var _auth = Base64.encode((username + password).toString()),
        rand = Math.floor(Math.random()*100000000).toString(),
        url = this.url + 'adduser?hash=' + rand + '&username=' + username + '&email=' + email + '&_auth=' + _auth,
        emailReg = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;

    if(emailReg.test(email)){
        request(url, function(error, res, body){
            if(error){
                cb(error);
            }else{
                if(res.statusCode == 200){
                    this.conf.setConf({
                        username : username,
                        _auth : _auth,
                        email : email
                    });
                    message = __("Adduser success!");
                    cb(null, message);
                }else{
                    cb(body);
                }
            }
        }.bind(this));
    }else{
        cb(__("email 格式不正确"));
    }
};
