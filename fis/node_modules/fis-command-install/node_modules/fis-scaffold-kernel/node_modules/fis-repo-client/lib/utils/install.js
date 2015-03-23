
/**
 * fis install package.json
 * fis install package
 * fis install package@version
 */

/**
 * todo :
 *  1. 对于已存在的缺少版本检测功能
 */
var fs = require("fs"),
    request = require('request'),
    AdmZip = require('adm-zip'),
    async = require('async'),
    exec = require('child_process').exec,
    debug = require('debug')('install'),
    Q = require('q'),
    path = require('path');

var CONFIG_FILE = 'package.json';

function download(dir, component, options, context){
    var deferred = Q.defer();
    var self = context,
        rand = Math.floor(Math.random()*100000000).toString(),
        url = self.url + 'install?hash=' + rand,
        postBody = {
            component : component,
            params : options
        },
        requestOption = {
            url : url,
            method : "POST",
            json : postBody,
            encoding : null //默认request会将body转化成字符串传输，encoding设置为null则可以拿到buffer，放置zip格式被破坏
        },
        extractDir = dir + "/" + component.name;

    if(self.util.isDir(extractDir) && !options.overwrite){
        self.util.log("log", "Install notice : Component [" + component.name + "] already exist!", "yellow");
        deferred.resolve('component already exist');
    }else{
        self.util.log("log", "Install start : Start download Component [" + component.name + "@" + component.version + "].", "white");
        request(requestOption, function(error, res, body){
            if(error){
                deferred.reject(new Error(error));
            }else{
                if(res.statusCode == 200){
                    var filename = res.headers["filename"],
                        filepath = dir + "/" + filename;
                    fs.writeFile(filepath, body, function(error){
                        if(!error){
                            self.util.log("log", "Install end : Finish download Component [" + component.name + "@" + component.version + "].", "white");
                            try{
                                var zipFile = new AdmZip(filepath);
                                zipFile.extractAllTo(extractDir, true);
                                self.util.del(filepath);
                            }catch(e){
                                deferred.reject(new Error(error));
                            }
                            self.util.del(filepath);
                            debug('download and unzip' + filename + " end");
                            deferred.resolve(component);
                        }else{
                            deferred.reject(new Error(error));
                        }
                    });
                }else{
                    deferred.reject(new Error(body));
                }
            }
        });
    }
    return deferred.promise;
};
/**
 * Install a component
 * @param {String} dir         The dir component install to
 * @param {Object} component   component信息，必须包括name、version
 * @param {Object} options     命令行参数
 * @param {Function} callback  回调函数，接受error,message两个参数
 */

function _install(dir, component, options, context, list_key){
    var deferred = Q.defer();
    var self = context;
    var options = options || {};
    //todo check deps default
    var deps = options.deps || true;
    var overwrite = options.overwrite || false;
    if(component){
        download(dir, component, options, self)
            .then(function(result){
                debug(component.name + ' start install deps');
                install_list.push(result);
                return _installDeps(dir, component, options, self);
            })
            .done(
                function(result){
                    deferred.resolve();
                }, function(err){
                    debug(component.name + ' download failed');
                    deferred.reject(err);
                }
        );
    }else{
        debug("Install must a component name or a package.json");
        deferred.reject("Install must a component name or a package.json");
    }
    return deferred.promise;
};

function getPackageJsonObj(dir, pkgName, context){
    var obj = null;
    var self = context;
    var jsonFile = path.normalize(dir + "/" + pkgName + "/" + CONFIG_FILE);
    if(self.util.isFile(jsonFile)){
        obj = self.util.readJSON(jsonFile);
    }
    return obj;
}

function execScript(dir, component, options, context){
    var deferred = Q.defer();
    var self = context;
    debug(component.name + ' start to exec script');

    var jsonObj = getPackageJsonObj(dir, component.name, self);

    if(jsonObj){
        var scripts = jsonObj.scripts ? jsonObj.scripts.install || null : null;
        if(scripts){
            var scripts_path = path.normalize(dir + '/'+ component.name + '/' + scripts);
            var root = path.normalize(dir + '/'+ component.name);
            debug(component.name + 'exec file path: ' + scripts_path);
            try{
                fs.chmodSync(scripts_path, '777');
            }catch(e){
                deferred.reject(e);
            }
            exec('node ' + scripts, {cwd : root}, function(err, stdout, stderr){
                if(err){
                    self.util.log("log", "Exec error : Component [" + component.name + "] " + "run scripis: [ " + scripts + " ] failed", "red");
                    self.util.log("log", err, "white");
                    deferred.reject(err);
                }else if(stdout){
                    self.util.log("log", "Exec success : Component [" + component.name + "] " + "run scripis: [ " + scripts + " ] success", "white");
                    debug('exec stdout: ' + stdout);
                    deferred.resolve('exec ' + scripts_path + 'success');
                }else{
                    deferred.reject(stderr);
                }
            });
        }else{
            deferred.resolve();
        }
    }else{
        deferred.resolve();
    }
    return deferred.promise;
}

function _installDeps(dir, component, options, context){
    var deferred = Q.defer();
    var self = context;
    var options = options || {};
    var jsonObj = getPackageJsonObj(dir, component.name, self);

    if(jsonObj){
        var dependencies = jsonObj.dependencies;
        if(options.deps && dependencies && !isEmptyObject(dependencies)){
            var params = [];
            var funcArr = [];
            for(var pkgname in dependencies){
                if(dependencies.hasOwnProperty(pkgname)){
                    params.push({
                        component : {
                            name : pkgname,
                            version : dependencies[pkgname]
                        },
                        dir : dir,
                        options : options
                    });
                    var c =  {
                        name : pkgname,
                        version : dependencies[pkgname]
                    };
                    funcArr.push(_install(dir, c, options, self));
                }
            }

            Q.all(funcArr)
                .then(function(results){
                    return execScript(dir, component, options, self);
                })
                .done(
                    function(result){
                        deferred.resolve();
                    },function(err){
                        deferred.reject(err);
                    }
            );
        }else{
            debug(component.name + " do not have deps");
            deferred.resolve('no deps');
        }
    }else{
        debug(component.name + " do not include package.json");
        deferred.resolve('no paclage.sjon');
    }
    return deferred.promise;
}

function isEmptyObject(obj){
    for(var name in obj){
        return false;
    }
    return true;
};

module.exports.install = _install;

module.exports.installDeps = _installDeps;