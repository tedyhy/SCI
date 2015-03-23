module.exports = RepoClient;

//support i18n
function get_local_lang(local) {
    var read = require('fs').readFileSync;
    return JSON.parse(read(__dirname + '/lang/' + local + '.json'));
}

function gettext (s) {
    var trans = get_local_lang('en-US');
    if (trans[s]) {
        return trans[s];
    }
    return s;
}

Object.defineProperty(global, '__', {
    value: gettext
});

Object.defineProperty(global, 'install_list', {
    value: []
});

function RepoClient(repos){
    var reg = /^http:\/\/(.*)/i;
    if(!repos.match(reg)){
        repos = "http://" + repos;
    }
    this.url = repos + "/repos/cli_";
}

require('fs').readdirSync(__dirname + "/lib").forEach(function (f) {
    if (!f.match(/\.js$/)) return;
    RepoClient.prototype[f.replace(/\.js$/, '')] = require('./lib/' + f);
});