var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

var Scaffold = require('../../');

describe('download', function () {
    it ('download from github', function (done) {
        var s = new Scaffold({
            type: 'github'
        });
        this.timeout(5000);
        s.download('xiangshouding/github-support-doc-type', function (err, path) {
            expect(err).to.be.equal(null);
            console.log(path);
            done();
        });
    });

    it ('download from gitlab', function (done) {
        var s = new Scaffold({
            type: 'gitlab'
        });
        s.download('fis-dev/fis-report-record', function (err, path) {
            expect(err).to.be.equal(null);
            console.log(path);
            done();
        });
    });
});

describe('release', function () {
    it ('release from github', function (done) {
        var s = new Scaffold({
            type: 'github'
        });
        var p = __dirname + '/tmp';
        this.timeout(10000);
        s.release(
            'xiangshouding/glob.js',
            p,
            [],
            [
                {
                    reg: '*glob.js',
                    release: 'glob/$&'
                },
                {
                    reg: '*',
                    release: false
                }
            ], function (err) {
                expect(err).to.be.equal(null);
                var files = s.util.find(p);
                expect(files).to.be.length(1);
                expect(files[0]).to.be.equal(p + '/glob/glob.js');
                s.util.del(p); //del tmp dir
                done();
            }
        );

    });
});