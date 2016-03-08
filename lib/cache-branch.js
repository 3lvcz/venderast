'use strict';

const co = require('co');

module.exports = class CacheBranch {
	constructor(cache, name) {
		if (!(cache instanceof require('./cache'))) {
			throw Error('cache is not an instance of Cache');
		}

		this._cache = cache;
		this._name = name;

		this.init();
	}

	init() {
		this._data = this._cache._data[`[${this._name}]`] ||
			(this._cache._data[`[${this._name}]`] = {});
	}

	set(key, val) {
		this._data[key] = val;
	}

	get(key) {
		return this._data[key];
	}

	remove(key) {
		delete this._data[key];
	}

	clear() {
		const self = this;
		return co(function *() {
			self.init();
			yield self.save();
		});
	}

	save() {
		return this._cache.save();
	}
};
