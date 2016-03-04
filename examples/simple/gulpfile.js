var gulp = require('gulp');
var venderast = require('../../')(/*require('./venderast.json')*/);

gulp.task('vendor', function() {
	return venderast.all();
});

gulp.task('default', ['vendor']);
