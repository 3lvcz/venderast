// 'use strict';
//
// const expect = require('chai').expect;
// const fs = require('../lib/fs');
// const Cache = require('../lib/cache');
// const CacheBranch = require('../lib/cache-branch');
// const path = require('path');
// const uuid = require('node-uuid');
// const PATH = path.join(__dirname, '.temp.json');
//
// describe('cache', () => {
//
//     describe('constructor', () => {
//
//         it('does not create a file when is called', () => {
//             const cache = new Cache(PATH);
//             let stat = null;
//
//             try { stat = fs.statSync(PATH); }
//             catch (e) { /* EMPTY */ }
//
//             expect(stat).to.equal(null);
//         });
//
//         it('reads a file on call if it exists', () => {
//             const key = 'a';
//             const val = 12;
//
//             fs.writeJsonSync(PATH, { [key]: val });
//
//             const cache = new Cache(PATH);
//
//             expect(cache.get(key)).to.equal(val);
//
//             fs.removeSync(PATH);
//         });
//
//         it('init branches from a file on call if file is exists', () => {
//             const data = { '[some branch]': { b: 16 }};
//
//             fs.writeJsonSync(PATH, data);
//
//             const cache = new Cache(PATH);
//
//             fs.removeSync(PATH);
//
//             const branch = cache.branch('some branch');
//
//             expect(branch).to.be.ok;
//             expect(branch.get('b')).to.equal(16);
//
//
//         });
//
//     });
//
//     describe('get', () => {
//
//         it('does not create a file, when is called', () => {
//             const cache = new Cache(PATH);
//             let stat = null;
//
//             try { stat = fs.statSync(PATH); }
//             catch (e) { /* EMPTY */ }
//
//             expect(stat).to.be.null;
//
//             cache.get('some_key');
//
//             try { stat = fs.statSync(PATH); }
//             catch (e) { /* EMPTY */ }
//
//             expect(stat).to.be.null;
//         });
//
//         it('returns an "undefined" when no value with such key', () => {
//             const cache = new Cache(PATH);
//             const res = cache.get('some_key');
//
//             expect(res).to.be.undefined;
//         });
//
//         it('returns a properly value from a file', () => {
//             const key = 'some_key';
//             const val = 7;
//
//             fs.writeJsonSync(PATH, { [key]: val });
//
//             const cache = new Cache(PATH);
//             const res = cache.get(key);
//
//             expect(res).to.equal(val);
//
//             fs.removeSync(PATH);
//         });
//
//         it('throws if branch with this name exists', () => {
//             const key = uuid.v4();
//             const cache = new Cache(PATH);
//
//             cache.branch(key);
//
//             expect(() => cache.get(key)).to.throw(Error);
//         });
//
//     });
//
//     describe('set', () => {
//
//         it('does not create a file, when is called', () => {
//             const cache = new Cache(PATH);
//             let stat = null;
//
//             try { stat = fs.statSync(PATH); }
//             catch (e) { /* EMPTY */ }
//
//             expect(stat).to.be.null;
//
//             cache.set('some_key', 7);
//
//             try { stat = fs.statSync(PATH); }
//             catch (e) { /* EMPTY */ }
//
//             expect(stat).to.be.null;
//         });
//
//         it('returns setted value by a get method', () => {
//             const cache = new Cache(PATH);
//             const key = 'some_key';
//             const val = uuid.v4();
//
//             cache.set(key, val);
//
//             const res = cache.get(key);
//
//             expect(res).to.equal(val);
//         });
//
//         it('returns all setted values by a get method', () => {
//             const cache = new Cache(PATH);
//             const obj1 = { key: uuid.v4(), value: uuid.v4() };
//             const obj2 = { key: uuid.v4(), value: uuid.v4() };
//
//             cache.set(obj1.key, obj1.value);
//             cache.set(obj2.key, obj2.value);
//
//             const res1 = cache.get(obj1.key);
//             const res2 = cache.get(obj2.key);
//
//             expect(res1).to.equal(obj1.value);
//             expect(res2).to.equal(obj2.value);
//         });
//
//         it('throws if branch with this name exists', () => {
//             const key = uuid.v4();
//             const cache = new Cache(PATH);
//
//             cache.branch(key);
//
//             expect(() => cache.set(key)).to.throw(Error);
//         });
//
//     });
//
//     describe('remove', () => {
//
//         it('removes previously setted value by its key', () => {
//             const cache = new Cache(PATH);
//             const key = uuid.v4();
//             const val = uuid.v4();
//
//             cache.set(key, val);
//             cache.remove(key);
//
//             const res = cache.get(key);
//
//             expect(res).to.be.undefined;
//         });
//
//         it('throws if branch with this name exists', () => {
//             const key = uuid.v4();
//             const cache = new Cache(PATH);
//
//             cache.branch(key);
//
//             expect(() => cache.remove(key)).to.throw(Error);
//         });
//
//     });
//
//     describe('save', () => {
//
//         afterEach(() => {
//             fs.removeSync(PATH);
//         });
//
//         it('returns a Promise', done => {
//             const cache = new Cache(PATH);
//             const res = cache.save();
//
//             expect(res).to.be.instanceof(Promise);
//
//             res.then(done).catch(done);
//         });
//
//         it('creates a file (even without any data)', done => {
//             const cache = new Cache(PATH);
//             cache.save().then(() => {
//                 const stat = fs.statSync(PATH);
//                 expect(stat.isFile()).to.be.true;
//                 done();
//             }).catch(done);
//         });
//
//         it('save data as a json', done => {
//             const cache = new Cache(PATH);
//             const key = uuid.v4();
//             const val = uuid.v4();
//
//             cache.set(key, val);
//
//             cache.save().then(() => {
//                 const json = fs.readJsonSync(PATH);
//                 expect(json).to.be.ok;
//                 expect(json).to.have.property(key);
//                 expect(json[key]).to.equal(val);
//                 done();
//             }).catch(done);
//         });
//
//         it('save branches data', done => {
//             const cache = new Cache(PATH);
//             const name = 'some branch';
//             const branch = cache.branch(name);
//
//             const key = uuid.v4();
//             const val = uuid.v4();
//
//             branch.set(key, val);
//
//             cache.save().then(() => {
//                 const json = fs.readJsonSync(PATH);
//
//                 expect(json[`[${name}]`]).to.be.ok;
//                 expect(json[`[${name}]`]).to.have.property(key);
//                 expect(json[`[${name}]`][key]).to.equal(val);
//
//                 done();
//             }).catch(done);
//         });
//
//     });
//
//     describe('clear', () => {
//
//         it('returns a Promise', done => {
//             const cache = new Cache(PATH);
//             const res = cache.clear();
//
//             expect(res).to.be.instanceof(Promise);
//
//             res.then(done).catch(done);
//         });
//
//         it('removes a file', done => {
//             const cache = new Cache(PATH);
//
//             fs.ensureFileSync(PATH);
//
//             cache.clear().then(() => {
//                 let stat = null;
//
//                 try {
//                     fs.statSync(PATH);
//                 } catch (e) { /* EMPTY */ }
//
//                 expect(stat).to.be.null;
//
//                 fs.removeSync(PATH, done);
//
//                 done();
//             }).catch(done);
//         });
//
//         it('removes stored key value', done => {
//             const cache = new Cache(PATH);
//             const key = uuid.v4();
//             const val = uuid.v4();
//
//             cache.set(key, val);
//
//             cache.clear().then(() => {
//                 const res = cache.get(key);
//
//                 expect(res).to.be.undefined;
//
//                 done();
//             }).catch(done);
//         });
//
//     });
//
//     describe('branch', () => {
//
//         it('returns a CacheBranch instance', () => {
//             const cache = new Cache(PATH);
//             const branch = cache.branch('some branch name');
//
//             expect(branch).to.be.instanceof(CacheBranch);
//         });
//
//         it('returns the same instance of CacheBranch within multiple calls with the same branch name', () => {
//             const cache = new Cache(PATH);
//             const name = 'some branch name';
//             const branch1 = cache.branch(name);
//             const branch2 = cache.branch(name);
//
//             expect(branch1).to.equal(branch2);
//         });
//
//     });
//
// });
