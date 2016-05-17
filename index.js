var path = require('path');
var co = require('co');
var gulp = require('gulp');
var _if = require('gulp-if');
var concat = require('gulp-concat');
var less = require('gulp-less');
var autoprefixer = require('gulp-autoprefixer');
var cleanCss = require('gulp-clean-css');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var through = require('through2').obj;

module.exports = function(config) {
	if (!config) {
		throw Error('No config provided');
	}

	if (!config.outDir) {
		throw Error('No `outDir` provided');
	}

	var scriptBundleNames = config.scripts ? Object.keys(config.scripts) : [];
	var styleBundleNames = config.styles ? Object.keys(config.styles) : [];

	return co(function *() {
		for (var i = 0; i < scriptBundleNames.length; i++) {
			yield process(config, 'scripts', scriptBundleNames[i]);
		}

		for (var i = 0; i < styleBundleNames.length; i++) {
			yield process(config, 'styles', styleBundleNames[i]);
		}
	});

	function process(config, category, bundleName) {
		var bundle = config[category][bundleName];

		if (!bundle) return Promise.reject(Error('Bundle with name `' + bundleName + '` is not found!'));
		if (!bundle.preset) return Promise.reject(Error('Bundle `' + bundleName + '` has no preset!'));

		var preset = config.presets[bundle.preset];

		if (!preset) return Promise.reject(Error('Preset `' + bundle.preset + '` for bundle `' + bundleName + '` is not found!'));

		var bundlePipeline = category === 'scripts' ? getScriptBundlePipeline : getStyleBundlePipeline;

		var stream = bundlePipeline(bundle, bundleName, preset, config.outDir);

		return new Promise(function(resolve, reject) {
			stream.on('end', resolve);
			stream.on('error', reject);
		});
	}
};

function getScriptBundlePipeline(bundle, bundleName, preset, outDir) {
	var pipeline = gulp.src(bundle.files);

	// REMOVE COMMENTS
	if (preset.minification) {
		pipeline = pipeline.pipe(removeComments());
	}

	// INITIALIZE SOURCEMAPS
	if (preset.sourcemaps) {
		pipeline = pipeline.pipe(sourcemaps.init());
	}

	// MINIFICATION
	if (preset.minification) {
		pipeline = preset.preminified ? pipeline.pipe(_if(isNotMin, uglify())) : pipeline.pipe(uglify());
	}

	// CONCATENATION
	pipeline = pipeline.pipe(concat(bundleName + '.js'));

	// SAVE SOURCEMAPS
	if (preset.sourcemaps) {
		pipeline = pipeline.pipe(sourcemaps.write());
	}

	// WRITE OUTPUT
	return pipeline.pipe(gulp.dest(outDir));

	function isNotMin(file) {
		return !/\.min\.js$/i.test(file.basename);
	}
}

function getStyleBundlePipeline(bundle, bundleName, preset, outDir) {
	var pipeline = gulp.src(bundle.files);

	// REMOVE COMMENTS
	if (preset.minification) {
		pipeline = pipeline.pipe(removeComments());
	}

	// INITIALIZE SOURCEMAPS
	if (preset.sourcemaps) {
		pipeline = pipeline.pipe(sourcemaps.init());
	}

	// LESS
	pipeline = pipeline.pipe(_if(/\.less$/i, less()));

	// AUTOPREFIXER
	if (preset.autoprefixer) {
		pipeline = pipeline.pipe(autoprefixer({ map: true, browsers: ['last 5 versions', '> 5%'] }));
	}

	// MINIFICATION
	if (preset.minification) {
		pipeline = preset.preminified ? pipeline.pipe(_if(isNotMin, cleanCss())) : pipeline.pipe(cleanCss());
	}

	// CONCATENATION
	pipeline = pipeline.pipe(concat(bundleName + '.css'));

	// SAVE SOURCEMAPS
	if (preset.sourcemaps) {
		pipeline = pipeline.pipe(sourcemaps.write());
	}

	// WRITE OUTPUT
	return pipeline.pipe(gulp.dest(outDir));

	function isNotMin(file) {
		return !/\.min\.css$/i.test(file.basename);
	}
}

function removeComments() {
	return through(function(file, enc, callback) {
		file.contents = new Buffer(file.contents.toString().replace(/\/\*[\w\W]*?\*\//g, ''));
		callback(null, file);
	});
}

// function handleScriptBundle(bundle, bundleName, preset, outDir) {
// 	return co(function *() {
// 		var content = '';

// 		for (var i = 0; i < bundle.files.length; i++) {
// 			var file = bundle.files[i];
// 			var fileContent = fs.readFileSync(file, 'utf8');

// 			content += '/* bundle: ' + bundle.name + ' */\r\n';
// 			content += '/* source path: ' + file + '*/\r\n';

// 			if (preset.preminified && /\.min\.js$/i.test(path.basename(file)) || !preset.minification) {
// 				content += fileContent + '\r\n\r\n';
// 				continue;
// 			}

// 			var uglifyResult = uglify.minify(fileContent, { fromString: true });

// 			content += uglifyResult.code + '\r\n\r\n';
// 		}

// 		fs.ensureDirSync(outDir);

// 		fs.writeFileSync(path.join(outDir, bundleName) + '.js', content);
// 	});
// }


// var path = require('path');
// var uuid = require('node-uuid');
// var co = require('co');
// var fs = require('fs-extra');
// var postcss = require('postcss');
// var autoprefixer = require('autoprefixer');
// var uglify = require('uglify-js');
// var less = require('less');
// var CleanCss = require('clean-css');

// module.exports = function(config) {
// 	return co(function *() {
// 		if (!config) {
// 			throw Error('No config provided');
// 		}

// 		if (!config.outDir) {
// 			throw Error('No `outDir` provided');
// 		}

// 		var scriptBundleNames = config.scripts ? Object.keys(config.scripts) : [];
// 		var styleBundleNames = config.styles ? Object.keys(config.styles) : [];

// 		for (var i = 0; i < scriptBundleNames.length; i++) {
// 			var bundleName = scriptBundleNames[i];
// 			var bundle = config.scripts[bundleName];
// 			var preset = config.presets[bundle.preset];

// 			if (!bundle) {
// 				throw Error('Bundle with name `' + bundleName + '` is not found!');
// 			}

// 			if (!bundle.preset) {
// 				throw Error('Bundle `' + bundleName + '` has no preset!');
// 			}

// 			if (!preset) {
// 				throw Error('Preset `' + bundle.preset + '` for bundle `' + bundleName + '` is not found!');
// 			}

// 			yield handleScriptBundle(bundle, bundleName, preset, config.outDir);
// 		}

// 		for (var i = 0; i < styleBundleNames.length; i++) {
// 			var bundleName = styleBundleNames[i];
// 			var bundle = config.styles[bundleName];
// 			var preset = config.presets[bundle.preset];

// 			if (!bundle) {
// 				throw Error('Bundle with name `' + bundleName + '` is not found!');
// 			}

// 			if (!bundle.preset) {
// 				throw Error('Bundle `' + bundleName + '` has no preset!');
// 			}

// 			if (!preset) {
// 				throw Error('Preset `' + bundle.preset + '` for bundle `' + bundleName + '` is not found!');
// 			}

// 			yield handleStyleBundle(bundle, bundleName, preset, config.outDir);
// 		}
// 	});

// 	// bundles.forEach(function(filename) {
// 	// 	var assetCache = {};
// 	// 	var content = '';
// 	// 	var endPath = '';

// 	// 	switch (path.extname(filename)) {
// 	// 		case '.css':
// 	// 			fse.emptyDirSync(config.assets.dest);

// 	// 			config.bundles[filename].forEach(function(moduleName) {
// 	// 				var moduleStyles = ensureArray(config.modules[moduleName]).filter(function(filepath) {
// 	// 					return /\.css$/.test(filepath);
// 	// 				}).map(function(filepath) {
// 	// 					var content = fs.readFileSync(filepath, {encoding: 'utf8'});
// 	// 					var reg = /url\((?:'|")?([^'"\/][^#?'"\)]+)[^\)]*\)/gi;
// 	// 					var res = null;
// 	// 					var asset;
// 	// 					var target;

// 	// 					while ((res = reg.exec(content)) !== null) {
// 	// 						if (/^(data:|https?:|#)/.test(res[1])) {
// 	// 							continue;
// 	// 						}

// 	// 						asset = path.join(filepath, '../', res[1]);

// 	// 						if (!assetCache[asset]) {

// 	// 							target = uuid.v4() + path.extname(asset);

// 	// 							fse.copySync(asset, path.join(config.assets.dest, target));

// 	// 							assetCache[asset] = target;
// 	// 						}

// 	// 						content = content.replace(res[1], path.join(config.assets.base, assetCache[asset]).replace(/\\/g, '/'));
// 	// 					}

// 	// 					return content;

// 	// 					//return fs.readFileSync(filepath, {encoding: 'utf8'});
// 	// 				}).join('\n/* - - - - - - - - - - */\n');

// 	// 				content += '/* ' + moduleName + ' */\n' + new CleanCSS({keepSpecialComments: 0}).minify(moduleStyles).styles + '\n\n';
// 	// 			});

// 	// 			endPath = path.join(config.dist, filename);

// 	// 			fse.ensureDirSync(config.dist);

// 	// 			fs.writeFileSync(endPath, content);
// 	// 			break;
// 	// 	}
// 	// });
// };



// function handleStyleBundle(bundle, bundleName, preset, outDir) {
// 	return co(function *() {
// 		var content = '';

// 		for (var i = 0; i < bundle.files.length; i++) {
// 			var file = bundle.files[i];
// 			var fileContent = fs.readFileSync(file, 'utf8');
// 			var isLess = path.extname(file) === '.less';
// 			var isMin = !isLess && /\.min\.css/i.test(path.basename(file));

// 			content += '/* bundle: ' + bundle.name + ' */\r\n';
// 			content += '/* source path: ' + file + '*/\r\n';

// 			if (isLess) {
// 				var lessResult = yield less.render(fileContent, { filename: path.resolve(file), sourceMap: {} });

// 				console.log('mapping: ' + lessResult.map);

// 				fileContent = lessResult.css;
// 			}

// 			if (preset.autoprefixer) {
// 				var autoprefixerResult = yield postcss([ autoprefixer({ browsers: ['last 5 versions', '> 5%'] }) ]).process(fileContent);

// 				fileContent = autoprefixerResult.css;
// 			}

// 			if (preset.preminified && isMin || !preset.minification) {
// 				content += fileContent + '\r\n\r\n';
// 				continue;
// 			}

// 			content += new CleanCss().minify(fileContent).styles + '\r\n\r\n';
// 		}

// 		fs.ensureDirSync(outDir);

// 		fs.writeFileSync(path.join(outDir, bundleName) + '.css', content);
// 	});
// }
