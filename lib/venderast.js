'use strict';

const path = require('path');
const fs = require('fs-extra');
const uglify = require('uglify-js');
const Cache = require('./cache');
const util = require('./util');

class Venderast {
	constructor(config) {
		this._cwd = process.cwd();
		this._readConfig(config);
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
		this._cache = new Cache(path.resolve(__dirname, '../.cache.json'));

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

	/**
	 * @param  {boolean} (forceRebuild) Default: false
	 * @return {Promise}
	 */
	all(forceRebuild) {

	}

	/**
	 * Rebuilds a bundle with a given filename.
	 * @param  {string} bundleFileName
	 * @param  {boolean} (forceRebuild) Default: false
	 * @return {Promise}
	 */
	bundle(bundleFileName, forceRebuild) {
		return new Promise((resolve, reject) => {
			const bundleExt = path.extname(bundleFileName);
			const bundleName = path.basename(bundleFileName, bundleExt);
			const bundlePath = path.resolve(this._dest, bundleFileName);
			const bundleEntries = this._getBundleEntries(bundleFileName);
			//const bundleDest = this._resolveBundlePath(bundleFileName);

			this._getMtimes(bundleEntries).then(results => {

				// DECIDE IF REBUILD IS REQUIRED BY CHANGES IN SOURCES
				const sourcesHasChanges = results.any(result => {
					const cacheValue = this._cache.get(result.file);
					return !cacheValue && result.mtime !== null ||
						cacheValue && result.mtime === null ||
						cacheValue !== result.mtime.toJSON();
				});

				// UPDATE IN-MEM CACHE
				results.forEach(result => {
					if (result.mtime === null) this._cache.remove(result.file);
					else this._cache.set(result.file, result.mtime);
				});

				// UPDATE IN-FILE CACHE
				this._cache.save().then(() => {

					// IF REBUILD IS NOT REQUIRED -> FINISH JOB
					if (!forceRebuild && !sourcesHasChanges) {
						return resolve();
					}

					// REBUILD A BUNDLE
					switch (bundleExt) {
						case '.js':
							this._buildJs(bundleName).then(resolve, reject);
							break;
						case '.css':
							this._buildCss(bundleName).then(resolve, reject);
							break;
					}
				}).catch(reject);

			}).catch(reject);

			// if forceRebuild is true
			// or bundle is not exists
			// or bundle mtime is different from cache
			// or any bundle module files has mtime which is different from cache
			// => rebuild bundle
			// else => do nothing
		});
	}

	/**
	 * @param  {string[]} bundleFileNames
	 * @param  {boolean} (forceRebuild) Default: false
	 * @return {Promise}
	 */
	bundles(bundleFileNames, forceRebuild) {

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

	_getBundleEntries(bundleFileName) {
		const ext = path.extname(bundleFileName);
		let entries = [];

		this._bundles[bundleFileName].forEach(moduleName => {
			entries.concat(this._modules[moduleName]);
		});

		return entries.filter(entry => path.extname(entry) === ext);
	}

	_resolveBundlePath(bundleFileName) {
		return path.resolve(this._cwd, this._dest, bundleFileName);
	}

	_getMtimes(files) {
		return new Promise((resolve, reject) => {
			Promise.all(files.map(file => new Promise(resolve => {
				fs.stat(file, (err, stat) => {
					if (err) resolve({ path: file, mtime: null });
					else resolve({ path: file, mtime: stat.mtime });
				});
			}))).then(() => {
				console.log('getMtimes promise all arguments', arguments);
				resolve();
			}, reject);
		});
	}

	_getBundleCacheKey(bundlePath) {
		let prefix = '';

		if (this._sourcemaps) {
			prefix += '[s]';
		}

		return prefix + bundlePath;
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

			const before = Date.now();
			const result = uglify.minify(scripts, this._sourcemaps ? {
				outSourceMap: bundleName + '.js.map'
			} : {});
			const after = Date.now();

			fs.ensureDir(this._dest, err => {
				if (err) return reject(err);

				fs.writeFile(destPath, result.code, 'utf8', err => {
					if (err) return reject(err);

					fs.writeFile(destPath + '.map', result.map, 'utf8', err => {
						if (err) return reject(err);

						fs.stat(destPath, (err, stat) => {
							if (err) return reject(err);

							this._cache.set(
								this._getBundleCacheKey(destPath), stat.mtime);
							this._cache.save().then(resolve, reject);
						});
					});
				});
			});
		});
	}

	_buildCss(bundleName) {
		return new Promise((resolve, reject) => {
			resolve();
		});
	}

	// build(bundleFileName) {
	// 	var basename = path.basename(bundleFileName);
	// 	var extname = path.extname(bundleFileName);
	//
	// 	return extname === '.js' ? this.buildJs(basename) :
	// 		extname === '.css' ? this.buildCss(basename) :
	// 		this.buildNoop(basename, extname);
	// }
	//
	// buildJs(bundleName) {
	// 	return new Promise((resolve, reject) => {
	//
	// 	});
	// }
	//
	// buildCss(bundleName) {
	// 	var workflow = initWorkflow(bundleName, function() {
	// 		return new Promise(function(resolve, reject) {
	//
	// 		});
	// 	});
	//
	// 	return new Promise(function(resolve, reject) {
	// 		async.series(workflow, function(err) {
	// 			if (err) reject(err);
	// 			else resolve();
	// 		});
	// 	});
	// }
	//
	// buildNoop(bundleName, extName) {
	// 	return new Promise(function(resolve, reject) {
	// 		reject(new Error(extName ' + is not supported!'));
	// 	});
	// }
}

module.exports = Venderast;
