'use strict';

const expect = require('chai').expect;
const fs = require('../lib/fs');
const Cache = require('../lib/cache');
const CacheBranch = require('../lib/cache-branch');
const path = require('path');
const uuid = require('node-uuid');
const PATH = path.join(__dirname, '.temp.json');

function getBranch(name) {
    name = name || uuid.v4();
    const cache = new Cache(PATH);
    return new CacheBranch(cache, name);
}

describe('cache-branch', () => {

    describe('constructor', () => {

        it('throws if cache is not an instance of Cache', () => {
            expect(() => new CacheBranch(function(){}, 'some name'))
                .to.throw(Error);
        });

        it('does not create a file when called', () => {
            const branch = getBranch();
            expect(fs.statSafeSync(PATH)).to.be.null;
        });

    });

    describe('get', () => {

        it('does not create a file when called', () => {
            const key = uuid.v4();
            const branch = getBranch();

            branch.get(key);

            expect(fs.statSafeSync(PATH)).to.be.null;
        });

        it('returns an "undefined" when no value with such key', () => {
            const key = uuid.v4();
            const branch = getBranch();

            expect(branch.get(key)).to.be.undefined;
        });

        it('returns a properly value from a file', () => {
            const name = uuid.v4();
            const key = uuid.v4();
            const val = uuid.v4();

            fs.writeJsonSync(PATH, { [`[${name}]`]: { [key]: val }});

            const branch = getBranch(name);

            fs.removeSync(PATH);

            expect(branch.get(key)).to.equal(val);
        });

    });

    describe('get', () => {

        it('does not create a file when called', () => {
            const key = uuid.v4();
            const val = uuid.v4();
            const branch = getBranch();

            branch.set(key, val);

            expect(fs.statSafeSync(PATH)).to.be.null;
        });

        it('returns setted value by a get method', () => {
            const branch = getBranch();
            const key = uuid.v4();
            const val = uuid.v4();

            branch.set(key, val);

            const res = branch.get(key);

            expect(res).to.equal(val);
        });

        it('returns all setted values by a get method', () => {
            const branch = getBranch();
            const obj1 = { key: uuid.v4(), value: uuid.v4() };
            const obj2 = { key: uuid.v4(), value: uuid.v4() };

            branch.set(obj1.key, obj1.value);
            branch.set(obj2.key, obj2.value);

            const res1 = branch.get(obj1.key);
            const res2 = branch.get(obj2.key);

            expect(res1).to.equal(obj1.value);
            expect(res2).to.equal(obj2.value);
        });

    });

});
