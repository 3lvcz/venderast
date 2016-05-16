var path = require('path');
var uuid = require('node-uuid');
var co = require('co');
var fs = require('fs-extra');

module.exports = function(config) {
	return co(function *() {
		if (!config) {
			throw Error('No config provided');
		}

		if (!config.outDir) {
			throw Error('No `outDir` provided');
		}

		for (var i = 0; i < (config.scripts || []).length; i++) {
			console.log('yield script bundle: ' + config.scripts[i].name);
			yield handleScriptBundle(config.scripts[i], config.outDir);
		}

		for (var i = 0; i < (config.styles || []).length; i++) {
			console.log('yield style bundle: ' + config.styles[i].name);
			yield handleStyleBundle(config.styles[i], config.outDir);
		}
	});

	// bundles.forEach(function(filename) {
	// 	var assetCache = {};
	// 	var content = '';
	// 	var endPath = '';

	// 	switch (path.extname(filename)) {
	// 		case '.css':
	// 			fse.emptyDirSync(config.assets.dest);

	// 			config.bundles[filename].forEach(function(moduleName) {
	// 				var moduleStyles = ensureArray(config.modules[moduleName]).filter(function(filepath) {
	// 					return /\.css$/.test(filepath);
	// 				}).map(function(filepath) {
	// 					var content = fs.readFileSync(filepath, {encoding: 'utf8'});
	// 					var reg = /url\((?:'|")?([^'"\/][^#?'"\)]+)[^\)]*\)/gi;
	// 					var res = null;
	// 					var asset;
	// 					var target;

	// 					while ((res = reg.exec(content)) !== null) {
	// 						if (/^(data:|https?:|#)/.test(res[1])) {
	// 							continue;
	// 						}

	// 						asset = path.join(filepath, '../', res[1]);

	// 						if (!assetCache[asset]) {

	// 							target = uuid.v4() + path.extname(asset);

	// 							fse.copySync(asset, path.join(config.assets.dest, target));

	// 							assetCache[asset] = target;
	// 						}

	// 						content = content.replace(res[1], path.join(config.assets.base, assetCache[asset]).replace(/\\/g, '/'));
	// 					}

	// 					return content;

	// 					//return fs.readFileSync(filepath, {encoding: 'utf8'});
	// 				}).join('\n/* - - - - - - - - - - */\n');

	// 				content += '/* ' + moduleName + ' */\n' + new CleanCSS({keepSpecialComments: 0}).minify(moduleStyles).styles + '\n\n';
	// 			});

	// 			endPath = path.join(config.dist, filename);

	// 			fse.ensureDirSync(config.dist);

	// 			fs.writeFileSync(endPath, content);
	// 			break;
	// 	}
	// });
};

function handleScriptBundle(bundle, outDir) {
	return co(function *() {
		var content = '';

		for (var i = 0; i < bundle.files.length; i++) {
			var file = bundle.files[i];
			var fileContent = fs.readFileSync(file, 'utf8');

			content += '/* bundle: ' + bundle.name + ' */\r\n';
			content += '/* source path: ' + file + '*/\r\n';

			if (!bundle.min || !bundle['force-min'] && /\.min\.js$/i.test(path.basename(file))) {
				content += fileContent;
			} else {
				content += require('uglify-js').minify(fileContent, { fromString: true }).code;
			}

			content += '\r\n\r\n';
		}

		fs.ensureDirSync(outDir);

		fs.writeFileSync(path.join(outDir, bundle.name) + '.js', content);
	});
}

function handleStyleBundle(bundle, outDir) {
	return co(function *() {
		var content = '';

		for (var i = 0; i < bundle.files.length; i++) {
			var file = bundle.files[i];
			var fileContent = fs.readFileSync(file, 'utf8');

			content += '/* bundle: ' + bundle.name + ' */\r\n';
			content += '/* source path: ' + file + '*/\r\n';

			if (path.extname(file) === '.less') {
				fileContent = (yield require('less').render(fileContent, { filename: path.resolve(file) })).css;
			}

			if (!bundle.min || !bundle['force-min'] && /\.min\.css$/i.test(path.basename(file))) {
				content += fileContent;
			} else {
				content += new(require('clean-css'))({ keepSpecialComments: 0 }).minify(fileContent).styles;
			}

			content += '\r\n\r\n';
		}

		fs.ensureDirSync(outDir);

		fs.writeFileSync(path.join(outDir, bundle.name) + '.css', content);
	});
}
