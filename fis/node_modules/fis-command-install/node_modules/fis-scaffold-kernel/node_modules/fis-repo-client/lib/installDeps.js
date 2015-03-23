var debug = require('debug'),
    _installDeps = require('./utils/install.js').installDeps;


module.exports = function(dir, component, options, cb){
    debug("install" + component.name + " end in client");
    var options = options || {};
    _installDeps(dir, component, options, this)
        .done(
            function(){
                cb(null, "install Deps" + component.name + " sucsess");
            },
            function(err){
                debug("install" + component.name + " failed in client");
                cb(err);
            }
    );
    debug("install" + component.name + " end in client");
};