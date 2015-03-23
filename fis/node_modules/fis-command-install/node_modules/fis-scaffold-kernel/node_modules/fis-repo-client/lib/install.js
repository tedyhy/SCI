
/**
 * fis install package.json
 * fis install package
 * fis install package@version
 */

/**
 * todo :
 *  1. 对于已存在的缺少版本检测功能
 */

var debug = require('debug')('install');
    _install = require('./utils/install.js').install;

/**
 * Install a component
 * @param {String} dir         The dir component install to
 * @param {Object} component   component信息，必须包括name、version
 * @param {Object} options     命令行参数
 * @param {Function} callback  回调函数，接受error,message两个参数
 */

function install(dir, component, options, cb){
    debug("install" + component.name + " start in client");
    var options = options || {};
    _install(dir, component, options, this)
        .done(
            function(result){
                cb(null, install_list || []);
            },
            function(err){
                debug("install" + component.name + " failed in client");
                cb(err);
            }
        );
    debug("install" + component.name + " end in client");
}

module.exports = install;
