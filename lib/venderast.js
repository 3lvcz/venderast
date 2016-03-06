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
	bundle(bundleFileName, forceRebuild) {
		const self = this;

		return co(function *() {
			const bundleExt = path.extname(bundleFileName);
			const bundleName = path.basename(bundleFileName, bundleExt);
			const bundlePath = path.resolve(self._dest, bundleFileName);
			const bundleEntries = self._getBundleEntries(bundleFileName);
			const bundleExists = (yield fs.statSafe(bundlePath)) !== null;
			const stats = yield util.collectStats(bundleEntries);

			// DECIDE IF REBUILD IS REQUIRED BY CHANGES IN SOURCES
			const sourceHasChanges = stats.some(result => {
				const cacheValue = self._cache.get(self._getCacheKey(
					bundleFileName, result.path));
				return !cacheValue && result.stat !== null ||
					cacheValue && result.stat === null ||
					cacheValue !== result.stat.mtime.toJSON();
			});

			// UPDATE IN-MEM CACHE
			stats.forEach(result => {
				if (result.stat === null) self._cache.remove(self._getCacheKey(
					bundleFileName, result.path));
				else self._cache.set(self._getCacheKey(
					bundleFileName, result.path), result.stat.mtime.toJSON());
			});

			// UPDATE IN-FILE CACHE
			yield self._cache.save();

			// IF REBUILD IS NOT REQUIRED -> FINISH JOB
			if (!forceRebuild && !sourceHasChanges && bundleExists) {
				return;
			}

			// REBUILD A BUNDLE OTHERWISE
			switch (bundleExt) {
				case '.js':
					yield self._buildJs(bundleName);
					break;
				case '.css':
					yield self._buildCss(bundleName);
					break;
			}

		});
	}

	/**
	 * Build all given bundles.
	 * @param  {string[]} bundleFileNames
	 * @param  {boolean} (forceRebuild) Default: false
	 * @return {Promise}
	 */
	bundles(bundleFileNames, forceRebuild) {
		const jobs = bundleFileNames.map(bundleFileName =>
			this.bundle(bundleFileName, forceRebuild));

		return Promise.all(jobs);
	}

	/**
	 * Build all bundles from config bundles list.
	 * @param  {boolean} (forceRebuild) Default: false
	 * @return {Promise}
	 */
	all(forceRebuild) {
		return this.bundles(Object.keys(this._bundles), forceRebuild);
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
		this._dest = config.dest;
		if (!this._dest) {
			throw Error('<dest> parameter is required!')
		}

		// READ ASSETS
		this._assets = config.assets || {};
		if (!this._assets.base) {
			this._assets.base = '.';
		}
		if (!this._assets.dest) {
			this._assets.dest = config.dest;
		}

		// INIT CACHE
		this._cache = new Cache(path.resolve(__dirname, `../${CACHE_NAME}`));

		// RESOLVE SOURCEMAPPING
		this._sourcemaps = config.sourcemaps !== false;

		// READ MODULES
		if (!config.modules) {
			throw Error('<modules> parameter is required!');
		}
		this._modules = util.ensureArrays(config.modules);
		this._moduleNames = Object.keys(this._modules);
		if (!this._moduleNames.length) {
			throw Error('<modules> does not provide any modules!');
		}

		// READ BUNDLES
		if (!config.bundles) {
			throw Error('<bundles> parameter is required!');
		}
		this._bundles = util.ensureArrays(config.bundles);
		this._bundleNames = Object.keys(this._bundles);
		if (!this._bundleNames.length) {
			throw Error('<bundles> does not provide any bundles!');
		}
	}

	_getCacheKey(bundleFileName, sourcePath) {
		return `${bundleFileName}:${path.resolve(sourcePath)}`;
	}

	_getBundleEntries(bundleFileName) {
		const ext = path.extname(bundleFileName);
		let entries = [];

		this._bundles[bundleFileName].forEach(moduleName => {
			entries = entries.concat(this._modules[moduleName]);
		});

		return entries.filter(entry => path.extname(entry) === ext);
	}

	_resolveBundlePath(bundleFileName) {
		return path.resolve(this._cwd, this._dest, bundleFileName);
	}

	_buildJs(bundleName) {
		return new Promise((resolve, reject) => {
			const scripts = [];
			const destPath = path.resolve(this._cwd, this._dest, bundleName + '.js');

			this._bundles[bundleName + '.js'].forEach(moduleName => {
				this._modules[moduleName]
					.filter(f => path.extname(f) === '.js')
					.map(f =>  path.resolve(this._cwd, f))
					.forEach(f => scripts.push(f));
			});

			const uglifyOpts = {};

			if (this._sourcemaps) {
				uglifyOpts.outSourceMap = bundleName + '.js.map';
				uglifyOpts.sourceRoot = '.';
				uglifyOpts.basePath = '.';
			}

			const result = uglify.minify(scripts, uglifyOpts);
			const self = this;

			co(function *() {

				// CREATES DIRECTORY IF NOT EXISTS
				yield fs.ensureDir(self._dest);

				// SAVE MINIFIED CODE
				yield fs.writeFile(destPath, result.code, 'utf8');

				// SAVE SOURCEMAPS IF REQUIRED
				if (self._sourcemaps) {
					yield fs.writeFile(destPath + '.map', result.map, 'utf8');
				}

				// SAVE CACHE TO FILE
				// yield self._cache.save();

				// FINISH THIS JOB
				resolve();

			}).catch(reject);
		});
	}

	_buildCss(bundleName) {
		return new Promise((resolve, reject) => {
			resolve();
		});
	}
}

module.exports = Venderast;
