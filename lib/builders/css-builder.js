'use strict';

const co = require('co');
const fs = require('../fs');
const CleanCSS = require('clean-css');
const BaseBuilder = require('./base-builder');

module.exports = class CssBuilder extends BaseBuilder {
    build(venderast, bundle) {
        return this._build(venderast, bundle);
    }

    _build(venderast, bundle) {
        const self = this;
        return co(function *() {

            const sources = [];

            for (let i = 0; i < bundle.sources.length; i++) {
                sources.push(yield self._prepareSource(bundle.sources[i]));
            }

            // MINIFY
            const buildResult = new CleanCSS({ keepSpecialComments: 0 })
                .minify(sources.join(''));

            if (buildResult.errors.length) {
                buildResult.errors.forEach(console.error.bind(console));
                throw Error('CssBuilder throw an error');
            }

            // CREATE A DEST DIRECTORY IF NOT EXISTS
			yield fs.ensureDir(venderast._dest);

			// WRITE CODE
			yield fs.writeFile(bundle.path, buildResult.styles, 'utf8');

        });
    }

    _prepareSource(source) {
        return co(function *() {

            // TODO: read source, parse urls, generate revs, replace urls, return results

            return yield fs.readFile(source, 'utf8');

        });
    }
};
