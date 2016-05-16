var gulp = require('gulp');
var venderast = require('../../');
var config = require('./venderast.json');

gulp.task('vendor', function(callback) {
	return venderast(config);
});

gulp.task('default', ['vendor']);
