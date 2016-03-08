// 'use strict';
//
// const expect = require('chai').expect;
// const util = require('../lib/util');
//
// describe('util', () => {
//
//     describe('ensureArray', () => {
//
//         it('returns an array when argument is not', () => {
//             const res = util.ensureArray('not an array');
//             expect(Array.isArray(res)).to.be.true;
//         });
//
//         it('returns the same array when argument is an array', () => {
//             const ar = [1, 2, 3];
//             const res = util.ensureArray(ar);
//             expect(res).to.equal(ar);
//         });
//
//     });
//
//     describe('distinct', () => {
//
//         it('can work :)', () => {
//             const ar = [1, 1, 2, 1, 3, 2, 5];
//             const ds = util.distinct(ar);
//
//             expect(ds).to.have.length(4);
//             expect(ds[0]).to.equal(1);
//             expect(ds[1]).to.equal(2);
//             expect(ds[2]).to.equal(3);
//             expect(ds[3]).to.equal(5);
//         });
//
//         it('is a pure function', () => {
//             let ar = [1, 2, 1];
//             const ds = util.distinct(ar);
//
//             expect(ar).to.not.equal(ds);
//             expect(ar).to.have.length(3);
//             expect(ds).to.have.length(2);
//         });
//
//         it('cast values to strings', () => {
//             const fn1 = function() {};
//             const fn2 = function() {};
//             const fn3 = function(as) {};
//
//             const ar = [fn1, fn2, fn3];
//             const ds = util.distinct(ar);
//
//             expect(ds).to.have.length(2);
//             expect(ds[0]).to.equal(fn1);
//             expect(ds[1]).to.equal(fn3);
//         });
//
//     });
//
// });
