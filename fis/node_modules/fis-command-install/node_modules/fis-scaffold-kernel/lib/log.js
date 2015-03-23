var _ = require('lodash');
var util = require('util');

var LEVEL = {
    DEBUG: 0x0001,
    NOTICE: 0x0010,
    WARNING: 0x0100,
    ERROR: 0x1000,
    ALL: 0x1111
};

/**
 * logger
 *
 * @examples
 * var l = new Log(fd, Log.ALL&~Log.ERROR, '');
 *
 * @param writer  file's fd
 * @param level
 * @param prefix
 * @returns {Log}
 * @constructor
 */
function Log(writer, level, prefix) {
    if (!(this instanceof Log)) return new Log(writer, level, prefix);
    this.writer = writer || process.stdout;
    this.prefix = prefix || '';
    this.level = (typeof level === 'undefined') ? LEVEL.ALL : level;
}

Log.prototype.log = function (msg, level) {
    if (level == LEVEL.DEBUG) {
        this.writer.write('[DEBUG] ' + this.prefix + ' ' + msg + '\n');
    } else if (level == LEVEL.NOTICE) {
        this.writer.write('[NOTICE] ' + this.prefix + ' ' + msg + '\n');
    } else if (level == LEVEL.WARNING) {
        this.writer.write('[WARNING] ' + this.prefix + ' ' + msg + '\n');
    } else if (level == LEVEL.ERROR) {
        this.writer.write('[ERROR] ' + this.prefix + ' ' + msg + '\n');
    } else {
        this.writer.write('[UNKNOWN] ' + this.prefix + ' ' + msg + '\n');
    }
};

Log.prototype.debug = function () {
    if (this.level & LEVEL.DEBUG) {
        this.log(util.format.apply(null, arguments), LEVEL.DEBUG);
    }
};

Log.prototype.notice = function () {
    if (this.level & LEVEL.NOTICE) {
        this.log(util.format.apply(null, arguments), LEVEL.NOTICE);
    }
};

Log.prototype.warn = function () {
    if (this.level & LEVEL.WARNING) {
        this.log(util.format.apply(null, arguments), LEVEL.WARNING);
    }
};

Log.prototype.error = function (err) {
    if (this.level & LEVEL.ERROR) {
        if (this.writer != process.stdout) {
            this.writer = process.stderr; //error message written to `stderr`
        }
        if (!(err instanceof Error)) {
            err = new Error('err');
        }
        this.log(err.message, LEVEL.ERROR);
        throw err;
    }
};

module.exports = Log;
_.merge(module.exports, LEVEL);