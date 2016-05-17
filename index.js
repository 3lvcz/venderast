var fs = require('fs-extra');
var path = require('path');
var uuid = require('node-uuid');
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

	if (config.assets) {
		if (!config.assets.base) throw Error('`assets` must provide `base` property!');
		if (!config.assets.outDir) throw Error('`assets` must provide `outDir` property!');

		fs.removeSync(path.resolve(config.assets.outDir));
	}

	var scriptBundleNames = config.scripts ? Object.keys(config.scripts) : [];
	var styleBundleNames = config.styles ? Object.keys(config.styles) : [];

	var jobs = [];

	for (var i = 0; i < scriptBundleNames.length; i++) {
		jobs.push(process(config, 'scripts', scriptBundleNames[i]));
	}

	for (var i = 0; i < styleBundleNames.length; i++) {
		jobs.push(process(config, 'styles', styleBundleNames[i]));
	}

	return Promise.all(jobs);

	function process(config, category, bundleName) {
		var bundle = config[category][bundleName];

		if (!bundle) return Promise.reject(Error('Bundle with name `' + bundleName + '` is not found!'));
		if (!bundle.preset) return Promise.reject(Error('Bundle `' + bundleName + '` has no preset!'));

		var preset = config.presets[bundle.preset];

		if (!preset) return Promise.reject(Error('Preset `' + bundle.preset + '` for bundle `' + bundleName + '` is not found!'));

		var stream = category === 'scripts'
			? runScriptBundlePipeline(bundle, bundleName, preset, config.outDir)
			: runStyleBundlePipeline(bundle, bundleName, preset, config.outDir, config.assets);

		return new Promise(function(resolve, reject) {
			stream.on('end', resolve);
			stream.on('error', reject);
		});
	}
};

function runScriptBundlePipeline(bundle, bundleName, preset, outDir) {
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

function runStyleBundlePipeline(bundle, bundleName, preset, outDir, assets) {
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

	// ASSETS
	if (preset.assets) {
		pipeline = pipeline.pipe(handleAssets(assets.base, assets.outDir));
	}

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

var assetCache = {};

function handleAssets(base, outDir) {
	var reg = /url\((?:'|")?([^'"\/][^#?'"\)]+)[^\)]*\)/gi;

	return through(function(file, enc, callback) {
		var contents = file.contents.toString();
		var res;

		while((res = reg.exec(contents)) !== null) {
			if (/^(data:|https?:|#)/.test(res[1])) {
				continue;
			}

			var assetPath = path.join(file.base, res[1]);

			if (!assetCache[assetPath]) {
				var targetName = uuid.v4() + path.extname(assetPath);

				fs.copySync(assetPath, path.join(outDir, targetName));

				assetCache[assetPath] = targetName;
			}

			contents = contents.replace(res[1], path.join(base, assetCache[assetPath]).replace(/\\/g, '/'));
		}

		file.contents = new Buffer(contents);

		callback(null, file);
	});
}
