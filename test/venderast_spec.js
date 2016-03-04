'use strict';

const fs = require('fs-extra');
const expect = require('chai').expect;
const Venderast = require('../lib/venderast');

const base_config = {
    bundles: {
        'main.css': 'main',
        'main.js': 'main'
    },
    modules: {
        main: [
            __dirname + '/assets/1.css',
            __dirname + '/assets/subfolder/2.css',
            __dirname + '/assets/1.js',
            __dirname + '/assets/2.js'
        ]
    },
    dest: __dirname + '/.tmp'
};

describe('Venderast', () => {

    describe('constructor', () => {

        it('throws an Error if config is not provided', () => {
            expect(() => {
                new Venderast(/* undefined */);
            }).to.throw(Error);
        });

        it('throws an Error if any of required config parameters is not provided', () => {
            expect(() => {
                new Venderast({ bundles: {}, modules: {} });
            }).to.throw(Error);

            expect(() => {
                new Venderast({ dest: '', modules: {} });
            }).to.throw(Error);

            expect(() => {
                new Venderast({ dest: '', bundles: {} });
            }).to.throw(Error);
        });

        it('throws an Error if any of modules or bundles are empty', () => {
            expect(() => {
                new Venderast({ bundles: {}, modules: {jquery: 'slkdjfs'} });
            }).to.throw(Error);

            expect(() => {
                new Venderast({ bundles: {jquery: 'fklsjdf'}, modules: {} });
            }).to.throw(Error);
        });

        it('returns an Venderast object if all parameters is ok', () => {
            const venderast = new Venderast({
                bundles: { 'vendor.js': ['jquery'] },
                modules: { 'jquery': ['some/path/to/jquery.js'] },
                dest: '.'
            });

            expect(venderast).to.be.instanceof(Venderast);
        });

        it('does not throws if bunles or modules key values is a strings', () => {
            const venderast = new Venderast({
                bundles: { 'vendor.js': 'jquery' },
                modules: { 'jquery': 'some/path/to/jquery.js' },
                dest: '.'
            });

            expect(venderast).to.be.instanceof(Venderast);
        });

    });

    describe('javascript', done => {

        describe('simple', () => {

            describe('bundle', () => {

                this.refBundle = fs.readFileSync(__dirname +
                    '/references/javascript/simple/main.js', 'utf8');
                this.refMap = fs.readFileSync(__dirname +
                    '/references/javascript/simple/main.js.map', 'utf8');

                afterEach(done => {
                    fs.removeSync(__dirname + '/.tmp');

                    new Venderast(base_config)
                        .clearCache()
                        .then(done, done);
                });

                it('creates bundle and sourcemap', done => {
                    const venderast = new Venderast(base_config);
                    venderast.bundle('main.js').then(() => {
                        const bundle = fs.readFileSync(__dirname +
                            '/.tmp/main.js', 'utf8');
                        const map = fs.readFileSync(__dirname +
                            '/.tmp/main.js.map', 'utf8');

                        expect(bundle).to.equal(this.refBundle);
                        expect(map).to.equal(this.refMap);

                        done();
                    }).catch(done);
                });

                // it('do not recompile a bundle when it is not modified', function(done) {
                //     this.timeout(15000);
                //
                //     const bundlePath = __dirname + '/.tmp/main.js';
                //     const mapPath = bundlePath + '.map';
                //
                //     new Venderast(base_config).bundle('main.js').then(() => {
                //         const bundleMtime = fs.statSync(bundlePath).mtime;
                //         const mapMtime = fs.statSync(mapPath).mtime;
                //
                //         new Venderast(base_config).bundle('main.js').then(() => {
                //
                //             console.log('2398472837648237647');
                //
                //             expect(fs.statSync(bundlePath).mtime)
                //                 .to.equal(bundleMtime);
                //             expect(fs.statSync(mapPath).mtime)
                //                 .to.equal(mapMtime);
                //
                //             done();
                //
                //         }).catch(done);
                //
                //     }).catch(done);
                // });

            });

        });

    });

});
