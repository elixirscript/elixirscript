var gulp = require('gulp');
var mocha = require('gulp-mocha');
var concat = require('gulp-concat');
var babel = require('gulp-babel');
var eslint = require('gulp-eslint');
var rollup = require('gulp-rollup');
var sourcemaps = require('gulp-sourcemaps');

var path = './priv/javascript';

var stdLibPath = path + '/lib/**/*.js';

var testPath = path + '/build/tests/**/*.spec.js';

var libPath = path + '/lib';

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
