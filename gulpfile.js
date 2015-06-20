var gulp = require('gulp');
var mocha = require('gulp-mocha');
var concat = require('gulp-concat');
var babel = require('gulp-babel');
var eslint = require('gulp-eslint');

var stdLibPath = './priv/alphonse/lib/**/*.js';

var testPath = './priv/alphonse/build/tests/**/*.spec.js';

gulp.task('dist', function() {
  return gulp.src([stdLibPath])
      .pipe(babel({sourceMap: false, modules:'ignore'}))
      .pipe(concat('elixir.js'))
      .pipe(gulp.dest('./priv/alphonse/dist'));
});

gulp.task('build', function() {
  return gulp.src([stdLibPath, '!./priv/alphonse/build/**/*.js', '!./priv/alphonse/*.js'])
      .pipe(babel({sourceMap: false, modules:'common'}))
      .pipe(gulp.dest('./priv/alphonse/build/lib'));
});

gulp.task('build_test', function() {
  return gulp.src(['./priv/alphonse/tests/**/*.spec.js'])
      .pipe(babel({sourceMap: false, modules:'common'}))
      .pipe(gulp.dest('./priv/alphonse/build/tests'));
});

gulp.task('test',['build', 'build_test'], function () {
  return gulp.src(testPath, {read: false})
    .pipe(mocha({reporter: 'nyan'}));
});

gulp.task('lint', function () {
    return gulp.src([stdLibPath, testPath, '!./priv/alphonse/build/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});


gulp.task('default', ['lint', 'test']);