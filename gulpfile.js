var gulp = require('gulp');
var mocha = require('gulp-mocha');
var concat = require('gulp-concat');
var babel = require('gulp-babel');

gulp.task('dist', function() {
  return gulp.src(['./priv/alphonse/lib/**/*.js'])
      .pipe(babel({sourceMap: false, modules:'ignore'}))
      .pipe(concat('elixir.js'))
      .pipe(gulp.dest('./priv/alphonse/dist'));
});

gulp.task('build', function() {
  return gulp.src(['./priv/alphonse/**/*.js', '!./priv/alphonse/build/**/*.js', '!./priv/alphonse/*.js'])
      .pipe(babel({sourceMap: false, modules:'common'}))
      .pipe(gulp.dest('./priv/alphonse/build'));
});

gulp.task('test',['build'], function () {
  return gulp.src('./priv/alphonse/build/tests/**/*.spec.js', {read: false})
    .pipe(mocha({reporter: 'nyan'}));
});


gulp.task('default', ['build', 'test']);