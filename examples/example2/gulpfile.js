var gulp = require('gulp');
var venderast = require('../../');
var config = require('./bundle.config.json');

gulp.task('default', function() {
	return venderast(config);
});
