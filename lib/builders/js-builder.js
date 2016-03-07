'use strict';

const uglify = require('uglify-js');
const co = require('co');
const fs = require('../fs');
const BaseBuilder = require('./base-builder');

module.exports = class JsBuilder extends BaseBuilder {
    build(venderast, bundle) {
        return Promise.all([
            this._updateCache(bundle),
            this._build(venderast, bundle)
        ]);
    }

    _updateCache(bundle) {
        const self = this;
        return co(function *() {
            for (let i = 0; i < bundle.sources.length; i++) {
                let source = bundle.sources[i];
                let stat = yield fs.stat(source);

                self._cache.set(self.getSourceCacheKey(bundle, source),
                    stat.mtime.toJSON());
            }

            yield self._cache.save();
        });
    }

    _build(venderast, bundle) {
        return co(function *() {

            // RESOLVE UGLIFYJS OPTIONS
			const uglifyOpts = {};
			if (venderast._sourcemaps) {
				uglifyOpts.outSourceMap = bundle.name + '.map';
				uglifyOpts.sourceRoot = '.';
				uglifyOpts.basePath = '.';
			}

			// MINIFY/MAKE SOURCEMAPS
			const uglifyResult = uglify.minify(bundle.sources, uglifyOpts);

			// CREATE A DEST DIRECTORY IF NOT EXISTS
			yield fs.ensureDir(venderast._dest);

			// WRITE CODE
			yield fs.writeFile(bundle.path, uglifyResult.code, 'utf8');

			// WRITE SOURCEMAPS
			if (venderast._sourcemaps) {
				yield fs.writeFile(bundle.path + '.map', uglifyResult.map, 'utf8');
			}
        });
    }
};
