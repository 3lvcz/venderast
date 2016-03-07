'use strict';

const co = require('co');
const fs = require('../fs');
const path = require('path');
const Cache = require('../cache');

module.exports = class BaseBuilder {
    constructor(builderName) {
        this._cache = new Cache(path.resolve(__dirname, `.${builderName}.json`));
    }

    buildRequired(bundle) {
        const self = this;
        return co(function *() {
            return (yield self._bundleExists(bundle)) === false ||
                (yield self._sourceHasChanges(bundle)) === true;
        });
    }

    build(venderast, bundle) {
        return Promise.reject('BaseBuilder#build is abstract');
    }

    clearCache() {
        return this._cache.clear();
    }

    getSourceCacheKey(bundle, source) {
        return `${bundle.name}:${source}`;
    }

    _bundleExists(bundle) {
		return co(function *() {
			return (yield fs.statSafe(bundle.path)) !== null;
		});
	}

    _sourceHasChanges(bundle) {
        let hasCodeChanges = bundle.sources.some(source => {
            const cacheKey = this.getSourceCacheKey(bundle, source);
            return !this._cache.get(cacheKey);
        });

        if (hasCodeChanges) {
            return Promise.resolve(true);
        }

		const self = this;

		return co(function *() {

			for (let i = 0; i < bundle.sources.length; i++) {

				const source = bundle.sources[i];
				const cacheKey = self.getSourceCacheKey(bundle, source);
				const cacheMtime = self._cache.get(cacheKey);

				const newMtime = (yield fs.stat(source)).mtime.toJSON();

				if (cacheMtime !== newMtime) {
					hasCodeChanges = true;
					break;
				}

			}

			return hasCodeChanges;

		});
    }
};
