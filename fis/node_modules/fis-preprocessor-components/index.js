var path = require('path');
var inited = false, componentsInfo, componentsDir;

var exports = module.exports = function (content, file, settings) {
    init();
    return content;
};

function init() {
    if (inited) {
        return;
    }
    inited = true;

    // 读取组件信息
    componentsInfo = {};
    componentsDir = (fis.config.get('component.dir') || '/components').replace(/\/$/, '');

    if (componentsDir[0] !== '/') {
        componentsDir = '/' + componentsDir;
    }

    var root = fis.project.getProjectPath();
    var includer =  new RegExp('^' + fis.util.escapeReg(root + componentsDir + '/') + '.*?component\.json$', 'i');

    fis.util.find(root, includer).forEach(function(file){
        var cName = path.basename(path.dirname(file));
        var json;

        try {
            json =require(file)
        } catch (e) {
            fis.log.warning('unable to load component.json of [' + cName + ']');
        }

        json.name = json.name || cName;
        componentsInfo[cName] = json;
    });

    var stack = [];
    fis.emitter.on('compile:start', function(file) {
        file.useShortPath = file.useShortPath !== false;
        stack.unshift(file.useShortPath);
    });

    fis.emitter.on('compile:end', function(file) {
        stack.shift();
    });


    // hack fis kernel.
    function hack(origin) {
        return function(filepath, dir) {
            var info = origin.apply(this, arguments);

            // 如果已经找到了，没必要再找了。
            if (info.file) {
                return info;
            } else if (info.rest[0] === '.' && !/\.(js)$/.test(info.rest)) {
                var test = findResource(info.rest, dir, origin);

                if (test.file) {
                    info.id = test.file.getId();
                    info.file = test.file;
                    return info;
                }
            }

            // 如果关闭了短路径功能。 useShortPath == false
            if (stack.length && !stack[0]) {
                return info;
            }

            var m = /^([0-9a-z-_]+)(?:\/(.+))?$/.exec(info.rest);
            if (m) {
                var cName = m[1];
                var subpath = m[2];
                var config = componentsInfo[cName];
                var resolved;

                if (!config) {
                    return info;
                }

                if (subpath) {
                    resolved = findResource(componentsDir + '/' + cName + '/' + subpath, path, origin);
                } else {
                    resolved = findResource(componentsDir + '/' + cName + '/' + (config.main || 'index'), path, origin);
                }

                // 根据规则找到了。
                if (resolved.file) {
                    info.id = resolved.file.getId();
                    info.file = resolved.file;
                }
            }

            return info;
        }
    }

    function findResource(name, path, finder) {
        finder = finder || fis.uri;
        var extList = ['.js', '.css', '.html', '.tpl', '.vm'];
        var info = finder(name, path);

        for (var i = 0, len = extList.length; i < len && !info.file; i++) {
            info = finder(name + extList[i], path);
        }

        return info;
    }

    // hack into fis.uri
    var uri = fis.uri;
    var hacked = fis.uri = hack(fis.uri);
    Object.keys(uri).forEach(function(key) {
        hacked[key] = uri[key];
    });
    hacked.getId = hack(uri.getId);
}
