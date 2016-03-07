'use strict';

exports.ensureArray = function(obj) {
	return Array.isArray(obj) ? obj : [obj];
};

exports.distinct = function(ar) {
	const hash = {};
	const res = [];
	for (let i = 0; i < ar.length; i++) {
		if (!hash[ar[i]]) {
			res.push(ar[i]);
			hash[ar[i]] = true;
		}
	}
	return res;
};

exports.sleep = function(ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
};
