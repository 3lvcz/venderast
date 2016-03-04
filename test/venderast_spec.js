'use strict';

const expect = require('chai').expect;
const fs = require('../lib/fs');
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

                const refBundle = fs.readFileSync(__dirname +
                    '/references/javascript/simple/main.js', 'utf8');
                const refMap = fs.readFileSync(__dirname +
                    '/references/javascript/simple/main.js.map', 'utf8');

                const buildCheck = () => {
                    const bundle = fs.readFileSync(__dirname +
                        '/.tmp/main.js', 'utf8');
                    const map = fs.readFileSync(__dirname +
                        '/.tmp/main.js.map', 'utf8');

                    expect(bundle).to.equal(refBundle);
                    expect(map).to.equal(refMap);
                };
                const rebuildCheck = (expectRebuild) => {
                    const bundle1 = fs.statSync(__dirname + '/.tmp/main.js');
                    const map1 = fs.statSync(__dirname + '/.tmp/main.js.map');
                    return () => {
                        const bundle2 = fs.statSync(__dirname + '/.tmp/main.js');
                        const map2 = fs.statSync(__dirname + '/.tmp/main.js.map');

                        expect(bundle1.mtime.toJSON() === bundle2.mtime.toJSON())
                            .to.equal(!expectRebuild);
                        expect(map1.mtime.toJSON() === map2.mtime.toJSON())
                            .to.equal(!expectRebuild);
                    };
                };

                afterEach(done => {
                    fs.removeSync(__dirname + '/.tmp');

                    new Venderast(base_config)
                        .clearCache()
                        .then(done, done);
                });

                it('creates bundle and sourcemap', done => {
                    new Venderast(base_config).bundle('main.js').then(() => {
                        buildCheck();
                        done();
                    }).catch(done);
                });

                it('do not recompile a bundle, when source is not modified', done => {
                    new Venderast(base_config).bundle('main.js').then(() => {

                        const checkSameBuild = rebuildCheck(false);

                        new Venderast(base_config).bundle('main.js').then(() => {

                            checkSameBuild();
                            done();

                        }).catch(done);

                    }).catch(done);
                });

                it('recompiles a bundle, when source is modified', done => {
                    new Venderast(base_config).bundle('main.js').then(() => {

                        const checkRebuild = rebuildCheck(true);

                        const sourcePath = base_config.modules.main[2];

                        const sourceContent = fs.readFileSync(sourcePath, 'utf8');

                        fs.writeFileSync(sourcePath, sourceContent, 'utf8');

                        new Venderast(base_config).bundle('main.js').then(() => {

                            checkRebuild();
                            done();

                        }).catch(done);

                    }).catch(done);
                });

                it('recompiles a bundle, when forceRebuild is true, even source is not modified', done => {
                    new Venderast(base_config).bundle('main.js').then(() => {

                        const checkRebuild = rebuildCheck(true);

                        new Venderast(base_config).bundle('main.js', true).then(() => {

                            checkRebuild();
                            done();

                        }).catch(done);

                    }).catch(done);
                });

            });

        });

        describe('without_sourcemaps', () => {

            describe('bundle', () => {

                const config = Object.assign({ sourcemaps: false }, base_config);
                const refBundle = fs.readFileSync(__dirname +
                    '/references/javascript/without_sourcemaps/main.js', 'utf8');

                const buildCheck = () => {
                    const bundle = fs.readFileSync(__dirname +
                        '/.tmp/main.js', 'utf8');
                    let map = null;
                    try {
                        map = fs.statSync(__dirname +
                            '/.tmp/main.js.map', 'utf8');
                    } catch (e) { /* EMPTY */ }

                    expect(bundle).to.equal(refBundle);
                    expect(map).to.be.null;
                };
                const rebuildCheck = (expectRebuild) => {
                    const bundle1 = fs.statSync(__dirname + '/.tmp/main.js');
                    return () => {
                        const bundle2 = fs.statSync(__dirname + '/.tmp/main.js');

                        expect(bundle1.mtime.toJSON() === bundle2.mtime.toJSON())
                            .to.equal(!expectRebuild);
                    };
                };

                afterEach(done => {
                    fs.removeSync(__dirname + '/.tmp');

                    new Venderast(base_config)
                        .clearCache()
                        .then(done, done);
                });

                it('creates only a bundle', done => {
                    new Venderast(config).bundle('main.js').then(() => {
                        buildCheck();
                        done();
                    }).catch(done);
                });

                it('do not recompile a bundle, when source is not modified', done => {
                    new Venderast(config).bundle('main.js').then(() => {

                        const checkSameBuild = rebuildCheck(false);

                        new Venderast(config).bundle('main.js').then(() => {

                            checkSameBuild();
                            done();

                        }).catch(done);

                    }).catch(done);
                });

                it('recompiles a bundle, when source is modified', done => {
                    new Venderast(config).bundle('main.js').then(() => {

                        const checkRebuild = rebuildCheck(true);

                        const sourcePath = config.modules.main[2];

                        const sourceContent = fs.readFileSync(sourcePath, 'utf8');

                        fs.writeFileSync(sourcePath, sourceContent, 'utf8');

                        new Venderast(config).bundle('main.js').then(() => {

                            checkRebuild();
                            done();

                        }).catch(done);

                    }).catch(done);
                });

                it('recompiles a bundle, when forceRebuild is true, even source is not modified', done => {
                    new Venderast(config).bundle('main.js').then(() => {

                        const checkRebuild = rebuildCheck(true);

                        new Venderast(config).bundle('main.js', true).then(() => {

                            checkRebuild();
                            done();

                        }).catch(done);

                    }).catch(done);
                });

            });

        });

    });

});
