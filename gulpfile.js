var gulp = require('gulp');
var mocha = require('gulp-mocha');
var concat = require('gulp-concat');
var babel = require('gulp-babel');
var eslint = require('gulp-eslint');
var rollup = require('gulp-rollup');
var sourcemaps = require('gulp-sourcemaps');

require("babel/polyfill");

var path = './priv/javascript';
var stdLibPath = path + '/lib/**/*.js';
var testPath = path + '/test_build/tests/**/*.spec.js';
var libPath = path + '/lib';

gulp.task('test_build', function() {
  return gulp.src(['./priv/javascript/lib/**/*.js'])
      .pipe(babel({sourceMap: false, modules:'common'}))
      .pipe(gulp.dest('./priv/javascript/test_build/lib'));
});

gulp.task('test_build_tests', function() {
  return gulp.src(['./priv/javascript/tests/**/*.spec.js'])
      .pipe(babel({sourceMap: false, modules:'common'}))
      .pipe(gulp.dest('./priv/javascript/test_build/tests'));
});

gulp.task('test', ['test_build', 'test_build_tests'], function () {
  return gulp.src(testPath, {read: false})
    .pipe(mocha({reporter: 'nyan'}));
});

gulp.task('lint', function () {
    return gulp.src([stdLibPath, testPath, '!./priv/javascript/build/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});

gulp.task('dist_build', function() {
  return gulp.src(['./priv/javascript/**/*.js', '!./priv/javascript/build/**/*.js', '!./priv/javascript/dist/**/*.js',  '!./priv/javascript/dist_build/**/*.js', '!./priv/javascript/tests/**/*.js'])
      .pipe(babel({whitelist: ['flow'], optional: ["minification.deadCodeElimination"]}))
      .pipe(gulp.dest('./priv/javascript/dist_build'));
});

gulp.task('dist_add_source_map', function() {
  return gulp.src(['./priv/javascript/dist/elixir.js'])
      .pipe(sourcemaps.init())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('./priv/javascript/dist'));
});


gulp.task('default', ['lint', 'test']);
