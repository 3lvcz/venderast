'use strict';

const co = require('co');
const path = require('path');
const fs = require('./fs');
const util = require('./util');

const CacheBranch = require('./cache-branch');

module.exports = class Cache {
	constructor(filepath) {
		this._filepath = filepath;
		this._branches = {};
		this._data = {};

		try {
			this._data = fs.readJsonSync(filepath);
			this._initBranches();
		}
		catch (e) {
			fs.removeSync(filepath);
		}
	}

	set(key, val) {
		if (this._branches[key]) {
			throw Error('Attempt to set a key used as a branch: ' + key);
		}

		this._data[key] = val;
	}

	get(key) {
		if (this._branches[key]) {
			throw Error('Attempt to get a key used as a branch: ' + key);
		}

		return this._data[key];
	}

	remove(key) {
		if (this._branches[key]) {
			throw Error('Attempt to remove a key used as a branch: ' + key);
		}

		delete this._data[key];
	}

	clear() {
		const self = this;
		return co(function *() {
			yield fs.remove(self._filepath);

			self._data = {};

			Object.keys(self._branches).forEach(b =>
				self._branches[b].init());
		});
	}

	branch(name) {
		return this._branches[name] ||
			(this._branches[name] = new CacheBranch(this, name));
	}

	save() {
		return fs.writeJson(this._filepath, this._data);
	}

	_initBranches() {
		for (let key in this._data) {
			if (key.startsWith('[') && key.endsWith(']')) {
				let name = key.substr(1, key.length - 2);
				this._branches[name] = new CacheBranch(this, name);
			}
		}
	}
};
