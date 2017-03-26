const gulp = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');

const path = './src/javascript';

gulp.task('build', () => gulp.src([`${path}/**/*.js`, `!${path}/dist_build/**/*.js`, `!${path}/tests/**/*.js`])
    .pipe(sourcemaps.init())
    .pipe(babel({ presets: ['react', 'stage-0'], babelrc: false }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./src/elixirscript')));
