module.exports = function(ret, conf, settings, opt) {

    fis.util.map(ret.src, function(subpath, file){

        if (!file.extras || !file.extras.derived) {
            return;
        }

        file.extras.derived.forEach(function(obj) {
            obj.__proto__ = file.__proto__;
            ret.pkg[obj.subpath] = obj;
        });

        delete file.extras.derived;
    });
};
