'use strict';

const co = require('co');
const path = require('path');
const uglify = require('uglify-js');
const Cache = require('./cache');
const util = require('./util');
const fs = require('./fs');

const CACHE_NAME = '.venderast.json';

class Venderast {
	constructor(config) {
		this._cwd = process.cwd();
		this._readConfig(config);
	}

	/**
	 * Build a one given bundle.
	 * @param  {string} bundleFileName
	 * @param  {boolean} (forceRebuild) Default: false
	 * @return {Promise}
	 */
	bundle(bundleName, forceRebuild) {

		// RESOLVE BUNDLE BY ITS NAME
		const bundle = this._bundles.filter(x => x.name === bundleName)[0];
		if (!bundle) throw Error('No such bundle: ' + bundleName);

		const self = this;

		return co(function *() {

			// DECIDE IF BUNDLE NEEDS TO (RE)BUILD
			const buildRequired = forceRebuild ||
				(yield self._bundleExists(bundle)) === false ||
				(yield self._sourceHasChanges(bundle)) === true;

			if (buildRequired) {

				// RESOLVE SOURCE FILE MODIFY DATES
				const sourceMtimes = yield self._collectMtimes(bundle);

				// BUILD A BUNDLE
				yield self._build(bundle);

				// SAVE RESOLVE SOURCE FILE MODIFY DATES IN MEM-CACHE
				self._writeSourceMtimes(bundle, sourceMtimes);

				// SAVE RELEVANT CACHE STATE INTO THE FILE
				yield self._cache.save();
			}

		});
	}

	bundles(bundleNames, forceRebuild) {

		// RESOLVE BUNDLES BY IT NAMES
		const bundles = this._bundles.filter(x => bundleNames.indexOf(x.name) >= 0);
		if (bundles.length !== bundleNames.length) {
			throw Error('Some bundles was not found: ' + bundleNames.filter(x =>
				bundles.indexOf(x) === -1));
		}

		const self = this;

		return co(function *() {

			// RESOLVE BUNDLES WHICH REQUIRE (RE)BUILD
			const buildRequiredBundles = [];

			for (let i = 0; i < bundles.length; i++) {

				let buildRequired = forceRebuild ||
					(yield self._bundleExists(bundles[i])) === false ||
					(yield self._sourceHasChanges(bundles[i])) === true;

				if (buildRequired) {
					buildRequiredBundles.push(bundles[i]);
				}

			}

			if (buildRequiredBundles.length) {

				// RESOLVE ALL SOURCE FILE MODIFY DATES
				const sourceMtimes = yield self._collectMtimes(
					util.distinct(buildRequiredBundles.reduce((out, b) =>
						out.concat(b.sources), [])));

				// BUILD ALL BUNDLES IN ANY ORDER
				yield Promise.all(buildRequiredBundles.map(b => self._build(b)));

				// SAVE RESOLVED SOURCE FILE MODIFY DATES FOR EACH BUNDLE IN MEM-CACHE
				buildRequiredBundles.forEach(bundle =>
					self._writeSourceMtimes(bundle, sourceMtimes.filter(smt =>
						bundle.sources.indexOf(smt.path) >= 0)));

				// SAVE RELEVANT CACHE STATE INTO THE FILE
				yield self._cache.save();
			}

		});

	}

	/**
	 * Build all bundles from config bundles list.
	 * @param  {boolean} (forceRebuild) Default: false
	 * @return {Promise}
	 */
	all(forceRebuild) {
		return this.bundles(this._bundles.map(x => x.name), forceRebuild);
	}

	/**
	 * @param  {string} moduleName
	 * @param  {boolean} (forceRebuild) Default: false
	 * @return {Promise}
	 */
	module(moduleName, forceRebuild) {

	}

	/**
	 * @param  {string[]} moduleNames
	 * @param  {boolean} (forceRebuild) Default: false
	 * @return {Promise}
	 */
	modules(moduleNames, forceRebuild) {

	}

	/**
	 * Clear both in-mem and in-file caches.
 	 * @return {Promise}
	 */
	clearCache() {
		return this._cache.clear();
	}

	_readConfig(config) {
		if (!config) {
			throw Error('Config is not provided!');
		}

		// READ DEST
		if (!config.dest) {
			throw Error('<dest> parameter is required!')
		}
		this._dest = path.resolve(config.dest);

		// READ ASSETS
		this._assets = config.assets || {};

		if (!config.assets || !config.assets.base) this._assets.base = '.';
		else this._assets.base = path.resolve(config.assets.base);

		if (!config.assets || !config.assets.dest) this._assets.dest = this._dest;
		else this._assets.dest = path.resolve(config.assets.dest);

		// INIT CACHE
		this._cache = new Cache(path.resolve(__dirname, `../${CACHE_NAME}`));

		// RESOLVE SOURCEMAPPING
		this._sourcemaps = config.sourcemaps !== false;

		// READ MODULES
		if (!config.modules) {
			throw Error('<modules> parameter is required!');
		}
		this._modules = Object.keys(config.modules).map(moduleName => ({
			name: moduleName,
			sources: util.ensureArray(config.modules[moduleName]).map(relPath =>
				path.resolve(this._cwd, relPath)),
		}));

		// READ BUNDLES
		if (!config.bundles) {
			throw Error('<bundles> parameter is required!');
		}
		this._bundles = Object.keys(config.bundles).map(bundleName => ({
			name: bundleName,
			ext: path.extname(bundleName),
			path: path.resolve(this._cwd, this._dest, bundleName),
			modules: this._modules.filter(module =>
				util.ensureArray(config.bundles[bundleName])
					.indexOf(module.name) >= 0)
		}));

		// SET SOURCES TO BUNDLES
		this._bundles.forEach(bundle => {
			bundle.sources = bundle.modules.reduce((out, module) =>
				out.concat(module.sources.filter(s =>
					path.extname(s) === bundle.ext)), []);
		});

		// SET RELATIVE BUNDLES TO MODULES
		this._modules.forEach(module => {
			module.relativeBundles = this._bundles.filter(bundle =>
				bundle.modules.indexOf(module) >= 0);
		});
	}

	_bundleExists(bundle) {
		return co(function *() {
			return (yield fs.statSafe(bundle.path)) !== null;
		});
	}

	_sourceHasChanges(bundle) {

		const self = this;

		return co(function *() {

			let hasCodeChanges = false;

			for (let i = 0; i < bundle.sources.length; i++) {

				const source = bundle.sources[i];
				const cacheKey = self._getCacheKey(bundle, source);
				const cacheMtime = self._cache.get(cacheKey);

				if (!cacheMtime) {
					hasCodeChanges = true;
					break;
				}

				const newMtime = (yield fs.stat(source)).mtime.toJSON();

				if (cacheMtime !== newMtime) {
					hasCodeChanges = true;
					break;
				}

			}

			if (hasCodeChanges || bundle.ext === '.js') {
				return hasCodeChanges;
			}

			// TODO: FOR CSS BUNDLES - CHECK ASSETS CHANGES TOO
			return hasCodeChanges;

		});
	}

	_collectMtimes(bundleOrFiles) {
		// TODO: FOR CSS BUNDLES COLLECT ASSETS MTIMES TOO

		const sources = Array.isArray(bundleOrFiles) ? bundleOrFiles
			: bundleOrFiles.sources;

		return co(function *() {
			const mtimes = [];

			for (let i = 0; i < sources.length; i++) {
				let stat = yield fs.stat(sources[i]);

				mtimes.push({
					path: sources[i],
					mtime: stat.mtime.toJSON()
				});
			}

			return mtimes;
		});
	}

	_writeSourceMtimes(bundle, sourceMtimes) {
		sourceMtimes.forEach(smt => this._cache.set(
			bundle.name + ':' + smt.path, smt.mtime));
	}

	_getCacheKey(bundle, source) {
		return `${bundle.name}:${source}`;
	}

	_build(bundle) {
		switch (bundle.ext) {
			case '.js': return this._buildJs(bundle);
			case '.css': return this._buildCss(bundle);
			default: return Promise.reject(bundle.ext + ' is not supported.');
		}
	}

	_buildJs(bundle) {
		const self = this;
		return co(function *() {

			// RESOLVE UGLIFYJS OPTIONS
			const uglifyOpts = {};
			if (self._sourcemaps) {
				uglifyOpts.outSourceMap = bundle.name + '.map';
				uglifyOpts.sourceRoot = '.';
				uglifyOpts.basePath = '.';
			}

			// MINIFY/MAKE SOURCEMAPS
			const uglifyResult = uglify.minify(bundle.sources, uglifyOpts);

			// CREATE A DEST DIRECTORY IF NOT EXISTS
			yield fs.ensureDir(self._dest);

			// WRITE CODE
			yield fs.writeFile(bundle.path, uglifyResult.code, 'utf8');

			// WRITE SOURCEMAPS
			if (self._sourcemaps) {
				yield fs.writeFile(bundle.path + '.map', uglifyResult.map, 'utf8');
			}
		});
	}

	_buildCss(bundleName) {
		return new Promise((resolve, reject) => {
			resolve();
		});
	}
}

module.exports = Venderast;
