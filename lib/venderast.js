'use strict';

const co = require('co');
const path = require('path');
const Cache = require('./cache');
const util = require('./util');

const JsBuilder = require('./builders/js-builder');
const CssBuilder = require('./builders/css-builder');

class Venderast {
	constructor(config) {
		this._cwd = process.cwd();
		this._readConfig(config);
		this._initBuilders();
	}

	/**
	 * Build a one given bundle.
	 * @param  {string} bundleName
	 * @param  {boolean} (forceRebuild) Default: false
	 * @return {Promise}
	 */
	bundle(bundleName, forceRebuild) {
		return this.bundles([bundleName], forceRebuild);
	}

	/**
	 * Build all given bundles.
	 * @param  {string[]} bundleNames
	 * @param  {boolean} (forceRebuild) Default: false
	 * @return {Promise}
	 */
	bundles(bundleNames, forceRebuild) {

		// RESOLVE BUNDLES BY IT NAMES
		const bundles = this._bundles.filter(x => bundleNames.indexOf(x.name) >= 0);
		if (bundles.length !== bundleNames.length) {
			throw Error('Some bundles was not found: ' + bundleNames.filter(x =>
				bundles.indexOf(x) === -1));
		}

		const self = this;

		return Promise.all(bundles.map(b => self._build(b, forceRebuild)));
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
	 * Clear both in-mem and in-file caches.
 	 * @return {Promise}
	 */
	clearCache() {
		const self = this;
		return co(function *() {
			//yield self._cache.clear();
			for (let key in self._builders) {
				yield self._builders[key].clearCache();
			}
		});
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

		if (!config.assets || !config.assets.dest) this._assets.dest = this._dest;
		else this._assets.dest = path.resolve(config.assets.dest);

		if (!config.assets || !config.assets.base) this._assets.base = this._assets.dest;
		else this._assets.base = path.resolve(config.assets.base);

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
	}

	_initBuilders() {
		this._builders = {
			'.js': new JsBuilder('js'),
			'.css': new CssBuilder('css')
		};
	}

	_build(bundle, forceRebuild) {
		const builder = this._builders[bundle.ext];

		if (!builder) {
			return Promise.reject(bundle.ext + ' is not supported.');
		}

		const self = this;

		return co(function *() {
			if (forceRebuild || (yield builder.buildRequired(bundle))) {
				yield builder.build(self, bundle, forceRebuild);
			}
		});
	}
}

module.exports = Venderast;
