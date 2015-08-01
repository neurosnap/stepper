'use strict';

var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var sass = require('gulp-sass');
var rename = require('gulp-rename');

gulp.task('sass', function() {
  var cssSrc = './scss/';
  var cssDist = './css/';
  var cssFiles = cssSrc + '**/*.scss';

  gutil.log('Compiling SASS files ...');

  return gulp.src(cssFiles)
    .pipe(sass().on('error', gutil.log))
    .pipe(gulp.dest(cssDist));
});

gulp.task('dev', function() {
  return gulp.src('src/stepper.js')
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(babel({
      modules: 'umd',
      stage: 0,
//      optional: ['runtime']
    }))
      //.pipe(uglify())
      .on('error', gutil.log)
    .pipe(rename('stepper.dev.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./'))
    .on('end', function() {
      gutil.log('Babel finished');
    });
});
