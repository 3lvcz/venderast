const fs = require('./fs');

exports.stringIsNotEqual = function(target, strings) {
	return strings.every(function(str) {
		return target !== str;
	});
};

exports.ensureArray = function(obj) {
	return Array.isArray(obj) ? obj : [obj];
};

exports.ensureArrays = function(obj) {
	return Object.keys(obj).reduce(function(result, key) {
		result[key] = exports.ensureArray( obj[key] );
		return result;
	}, {});
};

exports.collectStats = function(files) {
	return Promise.all(files.map(file => new Promise(resolve => {
		fs.stat(file)
			.then(stat => resolve({ path: file, stat }))
			.catch(() => resolve({ path: file, stat: null }));
	})));
};
