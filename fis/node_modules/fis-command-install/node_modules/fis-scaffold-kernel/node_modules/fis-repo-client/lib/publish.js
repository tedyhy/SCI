var request = require("request"),
    fs = require("fs"),
    archiver = require('archiver'),
    ignore = require("ignore")(),
    util = require('./util.js'),
    crypto = require('crypto'),
    FormData = require('form-data'),
    archive = archiver("zip");

/**
 * publish a component
 * @param {String} dir  组件的目录
 * @param {Object} options 命令行参数  必须含有force 是否强制发布
 * @param {Function} callback 回调函数，接受error,message两个参数
 */
module.exports = function(dir, options, callback){
    var pkgFile = dir + "/package.json",
        auth = this.conf.getConf("_auth"),
        email = this.conf.getConf("email"),
        username = this.conf.getConf("username"),

        dir = this.util.realpath(dir),
        ignoreFiles = [dir + '/.ignore',dir + '/.gitignore', dir + '/.npmignore', dir + '/.lightignore'];

    if(this.util.exists(pkgFile)){
        var configJson = this.util.readJSON(pkgFile);
        //json检查 name，version，keywords
        var m = validateJson(configJson);
        if(m){
            callback(m);
        }
        if(username && auth){
            var user = {
                    name : username,
                    email : email,
                    _auth : auth
                },
                component = {
                    name : configJson.name,
                    version : configJson.version
                },
                postBody = {
                    user : user,
                    email : email,
                    component : component,
                    options : options
                },
                rand = Math.floor(Math.random()*100000000).toString(),
                validate_url = this.url + "publish_auth?hash=" + rand,
                publish_url = this.url + "publish?hash=" + rand,
                validate_requestOption = {
                    url : validate_url,
                    method : "POST",
                    json : postBody
                };

            request(validate_requestOption, function(error, res, body){
                if(error){
                    callback(error);
                }else{
                    if(res.statusCode == 200){
                        var files = ignore.addIgnoreFile(ignoreFiles).filter(this.util.find(dir));
                        //publish包的名字添加随机数 __dirname
                        var componentZip = dir + '/' + component.name + "-" + component.version + "-" + RandomStr(5) + ".zip",
                        componentStream = fs.createWriteStream(componentZip);
                        archive.pipe(componentStream);
                        for(var i=0; i<files.length; i++){
                            archive.append(fs.createReadStream(files[i]), {name : files[i].replace(dir, '')});
                        }

                        archive.on('error', function(err) {
                            callback(err);
                        }.bind(this));

                        archive.finalize(function(error){
                            if(error){ callback(error);}
                        }.bind(this));

                        //在write流结束后，将文件读出发送到server。
                        componentStream.on('close', function() {
                            if(!this.util.isZip(componentZip)){
                                this.util.del(componentZip);
                                callback(__('sorry, zip failed, please try to publish again.'));
                            }else{
                                var readme = getReadFile.call(this, dir);
                                var zipStream = fs.createReadStream(componentZip);


                                var postData = {
                                    'file': zipStream,
                                    'user_name': username,
                                    'email': email,
                                    'config': JSON.stringify(configJson)
                                };

                                if(readme){
                                    postData['readme'] = fs.createReadStream(readme);
                                }

                                var form = new FormData();

                                for (var k in postData) {
                                    if (postData.hasOwnProperty(k)) {
                                        form.append(k, postData[k]);
                                    }
                                }

                                var that = this;
                                form.submit(publish_url, function(error, res){
                                    if(error){
                                        callback(error);
                                    } else {
                                        body = '';
                                        res.on('data', function (chunk) {
                                            body += chunk.toString();
                                        });

                                        res.on('end', function () {
                                            that.util.del(componentZip);
                                            if(res.statusCode == 200){
                                                callback(null, body);
                                            } else {
                                                callback(body);
                                            }
                                        });
                                    }
                                });

                            }
                        }.bind(this));
                    }else{
                        callback(body);
                    }
                }
            }.bind(this));

        }else{
            callback(__("You must adduser first!"));
        }
    }else{
        callback(util.sprintf(__("Could not publish, missing file [%s/package.json]"), dir));
    }
};

function RandomStr(byte){
    try{
        var random = crypto.randomBytes(byte).toString('hex');
        return random;
    }catch(e){
       return '';
    }
};

function getReadFile(dir){
    var files = ["README.md", 'readme.md', 'README', 'readme'];
    for(var i=0; i<files.length; i++){
        var file = dir + "/" + files[i];
        if(this.util.isFile(file)){
            return file;
        }
    }
    return null;
};

function validateJson(json){
    var m = [];
    var configFile = 'Package.json';
    if(!json.name){
        m.push(util.sprintf(__('%s must have name filed'), configFile));
    }
    if(!json.version){
        m.push(util.sprintf(__('%s must have version filed'), configFile));
    }

    if(!json.keywords){
        m.push(util.sprintf(__('%s must have keywords filed'), configFile));
    }
    
    if(m.length !== 0){
        return m.join('\n');
    }

    return false;
};