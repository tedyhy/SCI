var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

var fs = require('fs');
var _ = require('../../lib/util.js');

describe('_.del', function () {
    var p = __dirname + '/.tmp';
    before(function () {
        fs.mkdirSync(p);
    });

    after(function() {
        fs.rmdirSync(p);
    });

    it('_.del a file', function () {
        var f = p + '/del_1.log';
        fs.writeFileSync(f, 'test');
        expect(fs.existsSync(f)).to.be.equal(true);
        _.del(f);
        expect(fs.existsSync(f)).to.be.equal(false);
    });

    it ('_.del a dir', function () {
        var p1 = p + '/del_2';
        fs.mkdirSync(p1);
        expect(fs.existsSync(p1)).to.be.equal(true);
        _.del(p1);
        expect(fs.existsSync(p1)).to.be.equal(false);
    });

    it ('_.del ..', function () {

    });
});