var SS = require('..');

var s = new SS({
    type: 'gitlab',
    log: {
        level: 0
    }
});

// s.release(
//     'fex/node-runtime',
//     '/Users/shouding/Downloads/glob_t',
//     function (path, done) {
//         done();
//     },
//     [{
//         reg: '**'
//     }],
//     function (err) {
//         console.log(err);
//     }
// );

s.deliver('/Users/shouding/.fis-download/node-runtime.git', __dirname + '/downloads');