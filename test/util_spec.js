'use strict';

const fs = require('fs');
const path = require('path');
const uuid = require('node-uuid');
const expect = require('chai').expect;
const util = require('../lib/util');

describe('util', () => {

    describe('stringIsNotEqual', () => {

        it('throws an Error, when second argument is not an Array', () => {
            expect(() => {
                util.stringIsNotEqual('some string', 'not an array');
            }).to.throw(Error);
        });

        it('returns a true when it should', () => {
            const res = util.stringIsNotEqual('some string', [
                'some another',
                'some string2',
                'some strinG',
                'some strin'
            ]);

            expect(res).to.be.true;
        });

        it('returns a false when it should', () => {
            const res = util.stringIsNotEqual('some string', [
                'some another',
                'some string2',
                'some string',
                'some str'
            ]);

            expect(res).to.be.false;
        });

    });

    describe('ensureArray', () => {

        it('returns an array when argument is not', () => {
            const res = util.ensureArray('not an array');
            expect(Array.isArray(res)).to.be.true;
        });

        it('returns the same array when argument is an array', () => {
            const ar = [1, 2, 3];
            const res = util.ensureArray(ar);
            expect(res).to.equal(ar);
        });

    });

    describe('ensureArrays', () => {

        it('throws an error when argument cannot be called with Object#keys', () => {
            expect(() => {
                util.ensureArrays(null);
            }).to.throw(Error);

            expect(() => {
                util.ensureArrays(undefined);
            }).to.throw(Error);
        });

        it('returns an object', () => {
            const obj = { a: 7, b: 'some' };
            const res = util.ensureArrays(obj);

            expect(typeof obj).to.equal('object');
        });

        it('makes each property of an object to be an array', () => {
            const obj = { a: 7, b: 'some' };
            const res = util.ensureArrays(obj);

            expect(Array.isArray(res.a)).to.be.true;
            expect(Array.isArray(res.b)).to.be.true;
        });

        it('is pure function', () => {
            const obj = { a: 7, b: 'some' };
            const res = util.ensureArrays(obj);

            expect(typeof obj.a).to.equal('number');
            expect(typeof obj.b).to.equal('string');
        });

    });

    describe('collectStats', () => {

        it('returns a Promise', () => {
            const promised = util.collectStats([]);
            expect(promised).to.be.instanceof(Promise);
        });

        it('throws an Error if parameter is not an array', () => {
            expect(() => {
                util.collectStats({});
            }).to.throw(Error);
        });

        it('resolves a file stat if it exists and no errors was occured else null', done => {
            const self = path.resolve(__dirname, module.id);
            const fake = path.resolve(__dirname, uuid.v4());

            const selfMtime = fs.statSync(self).mtime.toJSON();
            expect(selfMtime).to.be.ok;

            util.collectStats([self, fake]).then(stats => {
                expect(stats).to.be.instanceof(Array);
                expect(stats).to.have.length(2);

                expect(stats[0]).to.be.ok;
                expect(stats[0].path).to.equal(self);
                expect(stats[0].stat).to.be.ok
                expect(stats[0].stat.mtime.toJSON())
                    .to.equal(selfMtime);

                expect(stats[1]).to.be.ok;
                expect(stats[1].path).to.equal(fake);
                expect(stats[1].stat).to.be.null;

                done();
            }).catch(done);
        });

    });

});
