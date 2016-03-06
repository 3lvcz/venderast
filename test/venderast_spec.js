'use strict';

const co = require('co');
const expect = require('chai').expect;
const fs = require('../lib/fs');
const Venderast = require('../lib/venderast');

const base_config = {
    bundles: {
        'main.css': ['main1', 'main2', 'main3'],
        'main.js': ['main1', 'main2', 'main3'],
        'main2.js': 'main1'
    },
    modules: {
        main1: [
            __dirname + '/assets/1.css',
            __dirname + '/assets/1.js'
        ],
        main2: __dirname + '/assets/subfolder/2.css',
        main3: __dirname + '/assets/2.js'
    },
    dest: __dirname + '/.tmp'
};

describe('Venderast', () => {

    before(done => {
        new Venderast(base_config).clearCache()
            .then(done, done);
    });

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
                    co(function *() {

                        yield new Venderast(base_config).bundle('main.js');

                        buildCheck();

                        done();

                    }).catch(done);
                });

                it('do not recompile a bundle, when source is not modified', done => {
                    co(function *() {

                        yield new Venderast(base_config).bundle('main.js');

                        const checkSameBuild = rebuildCheck(false);

                        yield new Venderast(base_config).bundle('main.js');

                        checkSameBuild();

                        done();

                    }).catch(done);
                });

                it('recompiles a bundle, when source is modified', done => {
                    co(function *() {

                        yield new Venderast(base_config).bundle('main.js');

                        const checkRebuild = rebuildCheck(true);

                        const sourcePath = base_config.modules.main1[1];

                        const sourceContent = fs.readFileSync(sourcePath, 'utf8');

                        yield fs.writeFile(sourcePath, sourceContent, 'utf8');

                        yield new Venderast(base_config).bundle('main.js');

                        checkRebuild();

                        done();

                    }).catch(done);
                });

                it('recompiles a bundle, when forceRebuild is true, even source is not modified', done => {
                    co(function *() {

                        yield new Venderast(base_config).bundle('main.js');

                        const checkRebuild = rebuildCheck(true);

                        yield new Venderast(base_config).bundle('main.js', true);

                        checkRebuild();

                        done();

                    }).catch(done);
                });

            });

            describe('bundles', () => {

                const refBundle1 = fs.readFileSync(__dirname +
                    '/references/javascript/simple/main.js', 'utf8');
                const refMap1 = fs.readFileSync(__dirname +
                    '/references/javascript/simple/main.js.map', 'utf8');
                const refBundle2 = fs.readFileSync(__dirname +
                    '/references/javascript/simple/main2.js', 'utf8');
                const refMap2 = fs.readFileSync(__dirname +
                    '/references/javascript/simple/main2.js.map', 'utf8');

                const buildCheck = () => {
                    const bundle1 = fs.readFileSync(__dirname +
                        '/.tmp/main.js', 'utf8');
                    const map1 = fs.readFileSync(__dirname +
                        '/.tmp/main.js.map', 'utf8');
                    const bundle2 = fs.readFileSync(__dirname +
                        '/.tmp/main2.js', 'utf8');
                    const map2 = fs.readFileSync(__dirname +
                        '/.tmp/main2.js.map', 'utf8');

                    expect(bundle1).to.equal(refBundle1);
                    expect(map1).to.equal(refMap1);
                    expect(bundle2).to.equal(refBundle2);
                    expect(map2).to.equal(refMap2);
                };
                const rebuildCheck = (expectRebuild) => {
                    const first_bundle1 = fs.statSync(__dirname + '/.tmp/main.js');
                    const first_map1 = fs.statSync(__dirname + '/.tmp/main.js.map');
                    const first_bundle2 = fs.statSync(__dirname + '/.tmp/main2.js');
                    const first_map2 = fs.statSync(__dirname + '/.tmp/main2.js.map');
                    return () => {
                        const second_bundle1 = fs.statSync(__dirname + '/.tmp/main.js');
                        const second_map1 = fs.statSync(__dirname + '/.tmp/main.js.map');
                        const second_bundle2 = fs.statSync(__dirname + '/.tmp/main2.js');
                        const second_map2 = fs.statSync(__dirname + '/.tmp/main2.js.map');

                        expect(first_bundle1.mtime.toJSON() === second_bundle1.mtime.toJSON())
                            .to.equal(!expectRebuild);
                        expect(first_map1.mtime.toJSON() === second_map1.mtime.toJSON())
                            .to.equal(!expectRebuild);
                        expect(first_bundle2.mtime.toJSON() === second_bundle2.mtime.toJSON())
                            .to.equal(!expectRebuild);
                        expect(first_map2.mtime.toJSON() === second_map2.mtime.toJSON())
                            .to.equal(!expectRebuild);
                    };
                };

                afterEach(done => {
                    fs.removeSync(__dirname + '/.tmp');

                    new Venderast(base_config)
                        .clearCache()
                        .then(done, done);
                });

                it('creates bundles and sourcemaps', done => {
                    co(function *() {

                        yield new Venderast(base_config).bundles([
                            'main.js', 'main2.js']);

                        buildCheck();

                        done();

                    }).catch(done);
                });

                it('do not recompile a bundles, when sources are not modified', done => {
                    co(function *() {

                        yield new Venderast(base_config).bundles([
                            'main.js', 'main2.js']);

                        const checkSameBuild = rebuildCheck(false);

                        yield new Venderast(base_config).bundles([
                            'main.js', 'main2.js']);

                        checkSameBuild();

                        done();

                    }).catch(done);
                });

                it('recompiles those bundles, which sources are modified', done => {
                    co(function *() {

                        yield new Venderast(base_config).bundles([
                            'main.js', 'main2.js']);

                        const checkRebuild = rebuildCheck(true);

                        const sourcePath = base_config.modules.main1[1];

                        const sourceContent = yield fs.readFile(sourcePath, 'utf8');

                        yield fs.writeFile(sourcePath, sourceContent, 'utf8');

                        yield new Venderast(base_config).bundles([
                            'main.js', 'main2.js']);

                        // EXPECT THAT BOTH BUNDLES ARE RECOMPILED
                        checkRebuild();

                        const bundle1Mtime = (yield fs.statSafe(__dirname +
                            '/.tmp/main.js')).mtime.toJSON();
                        const bundle2Mtime = (yield fs.statSafe(__dirname +
                            '/.tmp/main2.js')).mtime.toJSON();

                        const source2Path = base_config.modules.main3;
                        const source2Content = yield fs.readFile(source2Path, 'utf8');

                        yield fs.writeFile(source2Path, source2Content, 'utf8');

                        yield new Venderast(base_config).bundles([
                            'main.js', 'main2.js']);

                        // EXPECT THAT ONLY FIRST BUNDLE IS RECOMPILED THIS TIME
                        expect(bundle1Mtime).to.not.equal((yield fs.statSafe(
                            __dirname + '/.tmp/main.js')).mtime.toJSON());
                        expect(bundle2Mtime).to.equal((yield fs.statSafe(
                            __dirname + '/.tmp/main2.js')).mtime.toJSON());

                        done();

                    }).catch(done);
                });

                it('recompiles all bundles, when forceRebuild is true, even sources is not modified', done => {
                    co(function *() {

                        yield new Venderast(base_config).bundles([
                            'main.js', 'main2.js']);

                        const checkRebuild = rebuildCheck(true);

                        yield new Venderast(base_config).bundles([
                            'main.js', 'main2.js'], true);

                        checkRebuild();

                        done();

                    }).catch(done);
                });

            });

            describe('all', () => {

                const refBundle1 = fs.readFileSync(__dirname +
                    '/references/javascript/simple/main.js', 'utf8');
                const refMap1 = fs.readFileSync(__dirname +
                    '/references/javascript/simple/main.js.map', 'utf8');
                const refBundle2 = fs.readFileSync(__dirname +
                    '/references/javascript/simple/main2.js', 'utf8');
                const refMap2 = fs.readFileSync(__dirname +
                    '/references/javascript/simple/main2.js.map', 'utf8');

                const buildCheck = () => {
                    const bundle1 = fs.readFileSync(__dirname +
                        '/.tmp/main.js', 'utf8');
                    const map1 = fs.readFileSync(__dirname +
                        '/.tmp/main.js.map', 'utf8');
                    const bundle2 = fs.readFileSync(__dirname +
                        '/.tmp/main2.js', 'utf8');
                    const map2 = fs.readFileSync(__dirname +
                        '/.tmp/main2.js.map', 'utf8');

                    expect(bundle1).to.equal(refBundle1);
                    expect(map1).to.equal(refMap1);
                    expect(bundle2).to.equal(refBundle2);
                    expect(map2).to.equal(refMap2);
                };
                const rebuildCheck = (expectRebuild) => {
                    const first_bundle1 = fs.statSync(__dirname + '/.tmp/main.js');
                    const first_map1 = fs.statSync(__dirname + '/.tmp/main.js.map');
                    const first_bundle2 = fs.statSync(__dirname + '/.tmp/main2.js');
                    const first_map2 = fs.statSync(__dirname + '/.tmp/main2.js.map');
                    return () => {
                        const second_bundle1 = fs.statSync(__dirname + '/.tmp/main.js');
                        const second_map1 = fs.statSync(__dirname + '/.tmp/main.js.map');
                        const second_bundle2 = fs.statSync(__dirname + '/.tmp/main2.js');
                        const second_map2 = fs.statSync(__dirname + '/.tmp/main2.js.map');

                        expect(first_bundle1.mtime.toJSON() === second_bundle1.mtime.toJSON())
                            .to.equal(!expectRebuild);
                        expect(first_map1.mtime.toJSON() === second_map1.mtime.toJSON())
                            .to.equal(!expectRebuild);
                        expect(first_bundle2.mtime.toJSON() === second_bundle2.mtime.toJSON())
                            .to.equal(!expectRebuild);
                        expect(first_map2.mtime.toJSON() === second_map2.mtime.toJSON())
                            .to.equal(!expectRebuild);
                    };
                };

                afterEach(done => {
                    fs.removeSync(__dirname + '/.tmp');

                    new Venderast(base_config)
                        .clearCache()
                        .then(done, done);
                });

                it('creates bundles and sourcemaps', done => {
                    co(function *() {

                        yield new Venderast(base_config).all();

                        buildCheck();

                        done();

                    }).catch(done);
                });

                it('do not recompile a bundles, when sources are not modified', done => {
                    co(function *() {

                        yield new Venderast(base_config).all();

                        const checkSameBuild = rebuildCheck(false);

                        yield new Venderast(base_config).all();

                        checkSameBuild();

                        done();

                    }).catch(done);
                });

                it('recompiles those bundles, which sources are modified', done => {
                    co(function *() {

                        yield new Venderast(base_config).all();

                        const checkRebuild = rebuildCheck(true);

                        const sourcePath = base_config.modules.main1[1];

                        const sourceContent = yield fs.readFile(sourcePath, 'utf8');

                        yield fs.writeFile(sourcePath, sourceContent, 'utf8');

                        yield new Venderast(base_config).all();

                        // EXPECT THAT BOTH BUNDLES ARE RECOMPILED
                        checkRebuild();

                        const bundle1Mtime = (yield fs.statSafe(__dirname +
                            '/.tmp/main.js')).mtime.toJSON();
                        const bundle2Mtime = (yield fs.statSafe(__dirname +
                            '/.tmp/main2.js')).mtime.toJSON();

                        const source2Path = base_config.modules.main3;
                        const source2Content = yield fs.readFile(source2Path, 'utf8');

                        yield fs.writeFile(source2Path, source2Content, 'utf8');

                        yield new Venderast(base_config).all();

                        // EXPECT THAT ONLY FIRST BUNDLE IS RECOMPILED THIS TIME
                        expect(bundle1Mtime).to.not.equal((yield fs.statSafe(
                            __dirname + '/.tmp/main.js')).mtime.toJSON());
                        expect(bundle2Mtime).to.equal((yield fs.statSafe(
                            __dirname + '/.tmp/main2.js')).mtime.toJSON());

                        done();

                    }).catch(done);
                });

                it('recompiles all bundles, when forceRebuild is true, even sources is not modified', done => {
                    co(function *() {

                        yield new Venderast(base_config).all();

                        const checkRebuild = rebuildCheck(true);

                        yield new Venderast(base_config).all(true);

                        checkRebuild();

                        done();

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
                    co(function *() {

                        yield new Venderast(config).bundle('main.js');

                        const checkSameBuild = rebuildCheck(false);

                        yield new Venderast(config).bundle('main.js');

                        checkSameBuild();

                        done();

                    }).catch(done);
                });

                it('recompiles a bundle, when source is modified', done => {
                    co(function *() {

                        yield new Venderast(config).bundle('main.js');

                        const checkRebuild = rebuildCheck(true);

                        const sourcePath = config.modules.main1[1];

                        const sourceContent = fs.readFileSync(sourcePath, 'utf8');

                        yield fs.writeFile(sourcePath, sourceContent, 'utf8');

                        yield new Venderast(config).bundle('main.js');

                        checkRebuild();

                        done();

                    }).catch(done);
                });

                it('recompiles a bundle, when forceRebuild is true, even source is not modified', done => {
                    co(function *() {

                        yield new Venderast(config).bundle('main.js');

                        const checkRebuild = rebuildCheck(true);

                        yield new Venderast(config).bundle('main.js', true);

                        checkRebuild();

                        done();

                    }).catch(done);
                });

            });

            describe('bundles', () => {

                const config = Object.assign({ sourcemaps: false }, base_config);
                const refBundle1 = fs.readFileSync(__dirname +
                    '/references/javascript/without_sourcemaps/main.js', 'utf8');
                const refBundle2 = fs.readFileSync(__dirname +
                    '/references/javascript/without_sourcemaps/main2.js', 'utf8');

                const buildCheck = () => {
                    const bundle1 = fs.readFileSync(__dirname +
                        '/.tmp/main.js', 'utf8');
                    const bundle2 = fs.readFileSync(__dirname +
                        '/.tmp/main2.js', 'utf8');
                    let map1 = null;
                    let map2 = null;
                    try {
                        map1 = fs.statSync(__dirname +
                            '/.tmp/main.js.map', 'utf8');
                    } catch (e) { /* EMPTY */ }

                    try {
                        map2 = fs.statSync(__dirname +
                            '/.tamp/main2.js.map', 'utf8');
                    } catch (e) { /* EMPTY */ }

                    expect(bundle1).to.equal(refBundle1);
                    expect(bundle2).to.equal(refBundle2);
                    expect(map1).to.be.null;
                    expect(map2).to.be.null;
                };
                const rebuildCheck = (expectRebuild) => {
                    const first_bundle1 = fs.statSync(__dirname +
                        '/.tmp/main.js');
                    const first_bundle2 = fs.statSync(__dirname +
                        '/.tmp/main2.js');
                    return () => {
                        const second_bundle1 = fs.statSync(__dirname +
                            '/.tmp/main.js');
                        const second_bundle2 = fs.statSync(__dirname +
                            '/.tmp/main2.js');

                        expect(first_bundle1.mtime.toJSON() === second_bundle1.mtime.toJSON())
                            .to.equal(!expectRebuild);
                        expect(first_bundle2.mtime.toJSON() === second_bundle2.mtime.toJSON())
                            .to.equal(!expectRebuild);
                    };
                };

                afterEach(done => {
                    fs.removeSync(__dirname + '/.tmp');

                    new Venderast(config)
                        .clearCache()
                        .then(done, done);
                });

                it('creates bundles without sourcemaps', done => {
                    co(function *() {

                        yield new Venderast(config).bundles([
                            'main.js', 'main2.js']);

                        buildCheck();

                        done();

                    }).catch(done);
                });

                it('do not recompile a bundles, when sources are not modified', done => {
                    co(function *() {

                        yield new Venderast(config).bundles([
                            'main.js', 'main2.js']);

                        const checkSameBuild = rebuildCheck(false);

                        yield new Venderast(config).bundles([
                            'main.js', 'main2.js']);

                        checkSameBuild();

                        done();

                    }).catch(done);
                });

                it('recompiles those bundles, which sources are modified', done => {
                    co(function *() {

                        yield new Venderast(config).bundles([
                            'main.js', 'main2.js']);

                        const checkRebuild = rebuildCheck(true);

                        const sourcePath = config.modules.main1[1];

                        const sourceContent = yield fs.readFile(sourcePath, 'utf8');

                        yield fs.writeFile(sourcePath, sourceContent, 'utf8');

                        yield new Venderast(config).bundles([
                            'main.js', 'main2.js']);

                        // EXPECT THAT BOTH BUNDLES ARE RECOMPILED
                        checkRebuild();

                        const bundle1Mtime = (yield fs.statSafe(__dirname +
                            '/.tmp/main.js')).mtime.toJSON();
                        const bundle2Mtime = (yield fs.statSafe(__dirname +
                            '/.tmp/main2.js')).mtime.toJSON();

                        const source2Path = config.modules.main3;
                        const source2Content = yield fs.readFile(source2Path, 'utf8');

                        yield fs.writeFile(source2Path, source2Content, 'utf8');

                        yield new Venderast(config).bundles([
                            'main.js', 'main2.js']);

                        // EXPECT THAT ONLY FIRST BUNDLE IS RECOMPILED THIS TIME
                        expect(bundle1Mtime).to.not.equal((yield fs.statSafe(
                            __dirname + '/.tmp/main.js')).mtime.toJSON());
                        expect(bundle2Mtime).to.equal((yield fs.statSafe(
                            __dirname + '/.tmp/main2.js')).mtime.toJSON());

                        done();

                    }).catch(done);
                });

                it('recompiles all bundles, when forceRebuild is true, even sources is not modified', done => {
                    co(function *() {

                        yield new Venderast(config).bundles([
                            'main.js', 'main2.js']);

                        const checkRebuild = rebuildCheck(true);

                        yield new Venderast(config).bundles([
                            'main.js', 'main2.js'], true);

                        checkRebuild();

                        done();

                    }).catch(done);
                });

            });

            describe('all', () => {

                const config = Object.assign({ sourcemaps: false }, base_config);
                const refBundle1 = fs.readFileSync(__dirname +
                    '/references/javascript/without_sourcemaps/main.js', 'utf8');
                const refBundle2 = fs.readFileSync(__dirname +
                    '/references/javascript/without_sourcemaps/main2.js', 'utf8');

                const buildCheck = () => {
                    const bundle1 = fs.readFileSync(__dirname +
                        '/.tmp/main.js', 'utf8');
                    const bundle2 = fs.readFileSync(__dirname +
                        '/.tmp/main2.js', 'utf8');
                    let map1 = null;
                    let map2 = null;
                    try {
                        map1 = fs.statSync(__dirname +
                            '/.tmp/main.js.map', 'utf8');
                    } catch (e) { /* EMPTY */ }

                    try {
                        map2 = fs.statSync(__dirname +
                            '/.tamp/main2.js.map', 'utf8');
                    } catch (e) { /* EMPTY */ }

                    expect(bundle1).to.equal(refBundle1);
                    expect(bundle2).to.equal(refBundle2);
                    expect(map1).to.be.null;
                    expect(map2).to.be.null;
                };
                const rebuildCheck = (expectRebuild) => {
                    const first_bundle1 = fs.statSync(__dirname +
                        '/.tmp/main.js');
                    const first_bundle2 = fs.statSync(__dirname +
                        '/.tmp/main2.js');
                    return () => {
                        const second_bundle1 = fs.statSync(__dirname +
                            '/.tmp/main.js');
                        const second_bundle2 = fs.statSync(__dirname +
                            '/.tmp/main2.js');

                        expect(first_bundle1.mtime.toJSON() === second_bundle1.mtime.toJSON())
                            .to.equal(!expectRebuild);
                        expect(first_bundle2.mtime.toJSON() === second_bundle2.mtime.toJSON())
                            .to.equal(!expectRebuild);
                    };
                };

                afterEach(done => {
                    fs.removeSync(__dirname + '/.tmp');

                    new Venderast(config)
                        .clearCache()
                        .then(done, done);
                });

                it('creates bundles without sourcemaps', done => {
                    co(function *() {

                        yield new Venderast(config).all();

                        buildCheck();

                        done();

                    }).catch(done);
                });

                it('do not recompile a bundles, when sources are not modified', done => {
                    co(function *() {

                        yield new Venderast(config).all();

                        const checkSameBuild = rebuildCheck(false);

                        yield new Venderast(config).all();

                        checkSameBuild();

                        done();

                    }).catch(done);
                });

                it('recompiles those bundles, which sources are modified', done => {
                    co(function *() {

                        yield new Venderast(config).all();

                        const checkRebuild = rebuildCheck(true);

                        const sourcePath = config.modules.main1[1];

                        const sourceContent = yield fs.readFile(sourcePath, 'utf8');

                        yield fs.writeFile(sourcePath, sourceContent, 'utf8');

                        yield new Venderast(config).all();

                        // EXPECT THAT BOTH BUNDLES ARE RECOMPILED
                        checkRebuild();

                        const bundle1Mtime = (yield fs.statSafe(__dirname +
                            '/.tmp/main.js')).mtime.toJSON();
                        const bundle2Mtime = (yield fs.statSafe(__dirname +
                            '/.tmp/main2.js')).mtime.toJSON();

                        const source2Path = config.modules.main3;
                        const source2Content = yield fs.readFile(source2Path, 'utf8');

                        yield fs.writeFile(source2Path, source2Content, 'utf8');

                        yield new Venderast(config).all();

                        // EXPECT THAT ONLY FIRST BUNDLE IS RECOMPILED THIS TIME
                        expect(bundle1Mtime).to.not.equal((yield fs.statSafe(
                            __dirname + '/.tmp/main.js')).mtime.toJSON());
                        expect(bundle2Mtime).to.equal((yield fs.statSafe(
                            __dirname + '/.tmp/main2.js')).mtime.toJSON());

                        done();

                    }).catch(done);
                });

                it('recompiles all bundles, when forceRebuild is true, even sources is not modified', done => {
                    co(function *() {

                        yield new Venderast(config).all();

                        const checkRebuild = rebuildCheck(true);

                        yield new Venderast(config).all(true);

                        checkRebuild();

                        done();

                    }).catch(done);
                });

            });

        });

    });

});
