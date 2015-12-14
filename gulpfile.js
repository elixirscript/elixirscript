var gulp = require('gulp');
var mocha = require('gulp-mocha');
var concat = require('gulp-concat');
var babel = require('gulp-babel');
var eslint = require('gulp-eslint');
var rollup = require('gulp-rollup');
var sourcemaps = require('gulp-sourcemaps');

require("babel/polyfill");

var path = './src/javascript';
var stdLibPath = path + '/lib/**/*.js';
var testPath = path + '/test_build/tests/**/*.spec.js';
var libPath = path + '/lib';

gulp.task('test_build', function() {
  return gulp.src([path + '/lib/**/*.js'])
      .pipe(babel({sourceMap: false, modules:'common'}))
      .pipe(gulp.dest(path + '/test_build/lib'));
});

gulp.task('test_build_tests', function() {
  return gulp.src([path + '/tests/**/*.spec.js'])
      .pipe(babel({sourceMap: false, modules:'common'}))
      .pipe(gulp.dest(path + '/test_build/tests'));
});

gulp.task('test', ['test_build', 'test_build_tests'], function () {
  return gulp.src(testPath, {read: false})
    .pipe(mocha({reporter: 'nyan'}));
});

gulp.task('lint', function () {
    return gulp.src([stdLibPath, testPath, '!' + path + '/build/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});

gulp.task('dist_build', function() {
  return gulp.src([path + '/**/*.js', '!' + path + '/build/**/*.js', '!' + path + '/dist/**/*.js',  '!' + path + '/dist_build/**/*.js', '!' + path + '/tests/**/*.js'])
      .pipe(babel({whitelist: ['flow'], optional: ["minification.deadCodeElimination"]}))
      .pipe(gulp.dest(path + '/dist_build'));
});

gulp.task('dist_add_source_map', function() {
  return gulp.src(['./priv/Elixir.js'])
      .pipe(sourcemaps.init())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('./priv'));
});

gulp.task('npm_build', function() {
  npmDistPath = 'dist/npm'
  gulp.src('./package.json').pipe(gulp.dest(npmDistPath));
  gulp.src('./elixirscript').pipe(gulp.dest(npmDistPath));
  return gulp.src([path + '/**/*.js', '!' + path + '/build/**/*.js', '!' + path + '/dist/**/*.js',  '!' + path + '/dist_build/**/*.js', '!' + path + '/tests/**/*.js'])
      .pipe(babel({sourceMap: false, modules:'common'}))
      .pipe(gulp.dest(npmDistPath));
});

gulp.task('default', ['lint', 'test']);
