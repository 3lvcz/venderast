'use strict';

const path = require('path');
const fs = require('./fs');
const util = require('./util');

module.exports = class Cache {
	constructor(filepath) {
		this._filepath = filepath;
		this._data = {};

		try { this._data = fs.readJsonSync(filepath); }
		catch (e) { fs.removeSync(filepath); }
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
		return new Promise((resolve, reject) => {
			fs.remove(this._filepath).then(() => {
				this._data = {};
				resolve();
			}).catch(reject);
		});
	}

	save() {
		return fs.writeJson(this._filepath, this._data);
	}
};
