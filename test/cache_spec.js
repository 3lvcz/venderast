'use strict';

const expect = require('chai').expect;
const fs = require('../lib/fs');
const Cache = require('../lib/cache');
const path = require('path');
const uuid = require('node-uuid');
const PATH = path.join(__dirname, '.temp.json');

describe('cache', () => {

    describe('constructor', () => {

        it('does not create a file when is called', () => {
            const cache = new Cache(PATH);
            let stat = null;

            try { stat = fs.statSync(PATH); }
            catch (e) { /* EMPTY */ }

            expect(stat).to.equal(null);
        });

    });

    describe('get', () => {

        it('don\'t creates a file, when is called', () => {
            const cache = new Cache(PATH);
            let stat = null;

            try { stat = fs.statSync(PATH); }
            catch (e) { /* EMPTY */ }

            expect(stat).to.be.null;

            cache.get('some_key');

            try { stat = fs.statSync(PATH); }
            catch (e) { /* EMPTY */ }

            expect(stat).to.be.null;
        });

        it('returns an "undefined" when no value with such key', () => {
            const cache = new Cache(PATH);
            const res = cache.get('some_key');

            expect(res).to.be.undefined;
        });

        it('returns a properly value from a file', () => {
            const key = 'some_key';
            const val = 7;

            fs.writeJsonSync(PATH, { [key]: val });

            const cache = new Cache(PATH);
            const res = cache.get(key);

            expect(res).to.equal(val);

            fs.removeSync(PATH);
        });

    });

    describe('set', () => {

        it('don\'t creates a file, when is called', () => {
            const cache = new Cache(PATH);
            let stat = null;

            try { stat = fs.statSync(PATH); }
            catch (e) { /* EMPTY */ }

            expect(stat).to.be.null;

            cache.set('some_key', 7);

            try { stat = fs.statSync(PATH); }
            catch (e) { /* EMPTY */ }

            expect(stat).to.be.null;
        });

        it('returns setted value by a get method', () => {
            const cache = new Cache(PATH);
            const key = 'some_key';
            const val = uuid.v4();

            cache.set(key, val);

            const res = cache.get(key);

            expect(res).to.equal(val);
        });

        it('returns all setted values by a get method', () => {
            const cache = new Cache(PATH);
            const obj1 = { key: uuid.v4(), value: uuid.v4() };
            const obj2 = { key: uuid.v4(), value: uuid.v4() };

            cache.set(obj1.key, obj1.value);
            cache.set(obj2.key, obj2.value);

            const res1 = cache.get(obj1.key);
            const res2 = cache.get(obj2.key);

            expect(res1).to.equal(obj1.value);
            expect(res2).to.equal(obj2.value);
        });

    });

    describe('remove', () => {

        it('removes previously setted value by its key', () => {
            const cache = new Cache(PATH);
            const key = uuid.v4();
            const val = uuid.v4();

            cache.set(key, val);
            cache.remove(key);

            const res = cache.get(key);

            expect(res).to.be.undefined;
        });

    });

    describe('save', () => {

        afterEach(() => {
            fs.removeSync(PATH);
        });

        it('returns a Promise', done => {
            const cache = new Cache(PATH);
            const res = cache.save();

            expect(res).to.be.instanceof(Promise);

            res.then(done).catch(done);
        });

        it('creates a file (even without any data)', done => {
            const cache = new Cache(PATH);
            cache.save().then(() => {
                const stat = fs.statSync(PATH);
                expect(stat.isFile()).to.be.true;
                done();
            }).catch(done);
        });

        it('save data as a json', done => {
            const cache = new Cache(PATH);
            const key = uuid.v4();
            const val = uuid.v4();

            cache.set(key, val);

            cache.save().then(() => {
                const json = fs.readJsonSync(PATH);
                expect(json).to.be.ok;
                expect(json).to.have.property(key);
                expect(json[key]).to.equal(val);
                done();
            }).catch(done);
        });

    });

    describe('clear', () => {

        it('returns a Promise', done => {
            const cache = new Cache(PATH);
            const res = cache.clear();

            expect(res).to.be.instanceof(Promise);

            res.then(done).catch(done);
        });

        it('removes a file', done => {
            const cache = new Cache(PATH);

            fs.ensureFileSync(PATH);

            cache.clear().then(() => {
                let stat = null;

                try {
                    fs.statSync(PATH);
                } catch (e) { /* EMPTY */ }

                expect(stat).to.be.null;

                fs.removeSync(PATH, done);

                done();
            }).catch(done);
        });

        it('removes stored key value', done => {
            const cache = new Cache(PATH);
            const key = uuid.v4();
            const val = uuid.v4();

            cache.set(key, val);

            cache.clear().then(() => {
                const res = cache.get(key);

                expect(res).to.be.undefined;

                done();
            }).catch(done);
        });

    });

});
