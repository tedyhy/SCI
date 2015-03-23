var path = require('path');
var glob = require('glob.js');
var lodash = require('lodash');
var util = require('util');

Object.defineProperty(global, 'log', {
    writable: true,
    enumerable: true,
    value: {}
});

function Scaffold (options) {
    if (!(this instanceof Scaffold)) return new Scaffold(options);
    this._options = lodash.merge({
        encoding: 'utf-8',
        log: {}
    }, options);
    log = require('./lib/log.js')(this._options.log.writer, this._options.log.level);
    this.util = require('./lib/util.js');
}

Scaffold.prototype.download = function (id, cb, progress) {
    log.notice('will download component id: ' + id);
    if (!id) {
        log.error(new Error('invalid, '));
    }
    var supports = ['github', 'gitlab', 'lights'];
    var type = this._options['type'];
    if (!~supports.indexOf(type)) {
        type = 'lights';
    }
    var request = new (require('./lib/'+type))(this._options);
    log.notice(type + ': download start');
    request.download(id, cb, progress);
};

Scaffold.prototype.replace = function (path, map, use_prompt, callback) {
    var files = this.util.find(path);
    var that = this;
    function cb (err, result) {
        files.forEach(function (file) {
            //@TODO
            var content = that.util.read(file);
            that.map(result, function (v, k) {
                var reg = new RegExp(that.util.escapeRegExp(k), 'g');
                content = content.replace(reg, v);
            });
            //@TODO
            that.util.write(file, content, that._options.encoding);
        });
        callback && callback(err, path);
    }
    if (use_prompt) {
        this.prompt(map, cb);
    } else {
        cb(null, map);
    }
};

Scaffold.prototype.prompt = function (schema, cb) {
    cb = this.isFunction(cb) ? cb : function () {};
    if (!schema) {
        //@TODO
        cb (new Error('need schemas.'));
        return;
    }
    var prompt = require('prompt');
    prompt.start();
    prompt.get(schema, function (err, result) {
        cb(err, result);
    });
};

Scaffold.prototype._roadmap = function (roadmap) {
    var self = this;
    if (!this.isArray(roadmap)) {
        log.warn('roadmap must be a Array.');
        return [];
    }
    var map = [];
    roadmap.forEach(function (raw) {
        if (raw.reg) {
            if (self.isString(raw.reg)) {
                raw.reg = glob.make(raw.reg);
            }
            map.push({
                reg: raw.reg,
                release: (typeof raw.release == 'undefined') ? '$&' : raw.release
            });
        }
    });
    return map;
};

Scaffold.prototype.deliver = function (from, to, roadmap) {
    to = to || '';
    from = path.resolve(from);
    var map = this._roadmap(roadmap);
    var files = this.util.find(from);
    function _replaceDefine(match, release) {
        return release.replace(/\$(\d+|&)/g, function (m, $1) {
            var val = match[$1 == '&' ? 0 : $1];
            return typeof val == 'undefined' ? '' : val;
        });
    }

    var count = 0; //移动文件的个数
    var symlink = {};
    for (var i = 0, len = files.length; i < len; i++) {
        var file = files[i];
        var release;
        var isMatch = false;
        var isRelease = true;
        for (var j = 0; j < map.length; j++) {
            var rule = map[j];
            file.replace(from, '').replace(rule.reg, function () {
                if (rule.release) {
                    release = _replaceDefine(arguments, rule.release);
                } else {
                    isRelease = false;
                }
                isMatch = true;
            });
            if (isMatch) break;
        }

        if (!isRelease) {
            continue;
        }

        if (!isMatch) {
            release = file.replace(from, '');
        }
        log.debug('release %s to %s.', path.join(from, release), path.join(to, release));
        count++;
        this.util.copy(file, path.join(to, release), null, null, true, symlink); //copy
    }

    this.util.symlink(symlink);
    return count;
};

Scaffold.prototype.release = function (id, to, replacer, roadmap, cb) {
    var that = this;
    cb = !that.isFunction(cb) ? function () {} : cb;
    that.download(id, function (err, path) {
        if (err) {
            cb(err);
            return;
        }
        function deliver() {
            that.deliver(path, to, roadmap);
        }
        //@TODO
        if (that.isFunction(replacer)) {
            replacer(path, deliver);
        } else {
            that.replace(path, replacer, true, function (err) {
                if (!err) {
                    deliver();
                }
                cb(err);
            });
        }
    });
};

lodash.extend(Scaffold.prototype, lodash);

module.exports = Scaffold;
