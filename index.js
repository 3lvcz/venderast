var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');
var uglify = require('uglify-js');
var uuid = require('node-uuid');
var CleanCSS = require('clean-css');

module.exports = function(config) {
	if (!config) {
		config = require('./venderast.json');
	}

	var bundles = Object.keys(config.bundles);

	bundles.forEach(function(filename) {
		var assetCache = {};
		var content = '';
		var endPath = '';

		switch (path.extname(filename)) {
			case '.js':
				config.bundles[filename].forEach(function(moduleName) {
					var moduleScripts = ensureArray(config.modules[moduleName]).filter(function(filepath) {
						return /\.js$/.test(filepath);
					});

					content += '/* ' + moduleName + ' */\n' + uglify.minify(moduleScripts).code + '\n\n';
				});

				endPath = path.join(config.dist, filename);

				fse.ensureDirSync(config.dist);

				fs.writeFileSync(endPath, content);

				break;
			case '.css':
				fse.emptyDirSync(config.assets.dest);

				config.bundles[filename].forEach(function(moduleName) {
					var moduleStyles = ensureArray(config.modules[moduleName]).filter(function(filepath) {
						return /\.css$/.test(filepath);
					}).map(function(filepath) {
						var content = fs.readFileSync(filepath, {encoding: 'utf8'});
						var reg = /url\((?:'|")?([^'"\/][^#?'"\)]+)[^\)]*\)/gi;
						var res = null;
						var asset;
						var target;

						while ((res = reg.exec(content)) !== null) {
							if (/^https?:\/\//i.test(res[1])) {
								continue;
							}

							asset = path.join(filepath, '../', res[1]);

							if (!assetCache[asset]) {

								target = uuid.v4() + path.extname(asset);

								fse.copySync(asset, path.join(config.assets.dest, target));

								assetCache[asset] = target;
							}

							content = content.replace(res[1], path.join(config.assets.base, assetCache[asset]).replace(/\\/g, '/'));
						}

						return content;

						//return fs.readFileSync(filepath, {encoding: 'utf8'});
					}).join('\n/* - - - - - - - - - - */\n');

					content += '/* ' + moduleName + ' */\n' + new CleanCSS({keepSpecialComments: 0}).minify(moduleStyles).styles + '\n\n';
				});

				endPath = path.join(config.dist, filename);

				fse.ensureDirSync(config.dist);

				fs.writeFileSync(endPath, content);
				break;
		}
	});
};

function ensureArray(obj) {
    return Array.isArray(obj) ? obj : [obj];
}
