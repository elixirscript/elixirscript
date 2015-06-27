var gulp = require('gulp');
var mocha = require('gulp-mocha');
var concat = require('gulp-concat');
var babel = require('gulp-babel');
var eslint = require('gulp-eslint');

var path = './priv/javascript';

var stdLibPath = path + '/lib/**/*.js';

var testPath = path + '/build/tests/**/*.spec.js';

var libPath = path + '/lib';

var libs = [
  libPath + '/bit_string.js',
  libPath + '/erlang.js',
  libPath + '/kernel/js.js',
  libPath + '/kernel/special_forms.js',
  libPath + '/kernel.js',
  libPath + '/atom.js',
  libPath + '/enum.js',
  libPath + '/integer.js',
  libPath + '/list.js',
  libPath + '/logger.js',
  libPath + '/mutable.js',
  libPath + '/range.js',
  libPath + '/tuple.js'
];

gulp.task('dist', function() {
  return gulp.src(libs)
      .pipe(babel({ sourceMap: false, modules:'ignore' }))
      .pipe(concat('elixir.js'))
      .pipe(gulp.dest('./priv/javascript/dist'));
});

gulp.task('build', function() {
  return gulp.src([libPath + '/**/*.js'])
      .pipe(babel({sourceMap: false, modules:'common'}))
      .pipe(gulp.dest('./priv/javascript/build/lib'));
});

gulp.task('build_test', function() {
  return gulp.src(['./priv/javascript/tests/**/*.spec.js'])
      .pipe(babel({sourceMap: false, modules:'common'}))
      .pipe(gulp.dest('./priv/javascript/build/tests'));
});

gulp.task('test',['build', 'build_test'], function () {
  return gulp.src(testPath, {read: false})
    .pipe(mocha({reporter: 'nyan'}));
});

gulp.task('lint', function () {
    return gulp.src([stdLibPath, testPath, '!./priv/javascript/build/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});


gulp.task('default', ['lint', 'test']);