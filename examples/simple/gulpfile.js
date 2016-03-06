var gulp = require('gulp');
var venderast = require('../../')(/*require('./venderast.json')*/);

gulp.task('vendor', function() {
	return venderast();
	// is the same as
	// return venderast.obj.all();
});

gulp.task('default', ['vendor']);
