var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

var ob = require('catch-output');

var fs = require('fs');

var Log = require('../../lib/log.js');

describe('log new', function () {
    it ('param is default', function () {
        var log = new Log();
        ['log', 'warn', 'error', 'notice'].forEach(function (raw) {
            expect(log).to.have.property(raw);
        });
        expect(log.writer).to.equal(process.stdout);
    });

    it ('write to file', function () {
        var writer = fs.createWriteStream('./log.txt');
        var log = new Log(writer);
        expect(log.writer).to.equal(writer);
    });
});

describe('log.notice', function () {
    it('to stdout', function () {
        var ss = ob.catchOutput(function () {
            var log = new Log();
            log.notice('debug');
        });
        expect(ss.toString()).to.be.equal('[NOTICE]  debug\n');
    });
});