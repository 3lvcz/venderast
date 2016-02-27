var gulp = require('gulp');
var venderast = require('../../');
var config = require('./venderast.json');

gulp.task('vendor', function(callback) {
	venderast(config);
	callback();
});

gulp.task('default', ['vendor']);
