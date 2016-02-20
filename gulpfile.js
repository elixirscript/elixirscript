var gulp = require('gulp');
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');

var path = './src/javascript';

gulp.task('build', function() {
  return gulp.src([path + '/**/*.js', '!' + path + '/dist_build/**/*.js', '!' + path + '/tests/**/*.js'])
    .pipe(sourcemaps.init())
    .pipe(babel({ presets: ["react", "stage-0"], babelrc: false }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./src/elixirscript'));
});
