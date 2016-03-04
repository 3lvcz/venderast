'use strict';

const path = require('path');
const fs = require('fs-extra');
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
			fs.remove(this._filepath, err => {
				if (err) return reject(err);
				this._data = {};
				resolve();
			})
		});
	}

	save() {
		return new Promise((resolve, reject) => {
			fs.writeJson(this._filepath, this._data, err => {
				if (err) reject(err);
				else resolve();
			});
		});
	}
};
