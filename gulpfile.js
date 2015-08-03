'use strict';

var path = require('path');
var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var sass = require('gulp-sass');
var less = require('gulp-less');
var rename = require('gulp-rename');

gulp.task('default', function() {
  return gulp.src('src/stepper.js')
    .pipe(babel({
      modules: 'umd',
      stage: 0,
    }))
      .pipe(uglify())
      .on('error', gutil.log)
    .pipe(rename('stepper.min.js'))
    .pipe(gulp.dest('./'))
    .on('end', function() {
      gutil.log('Babel finished');
    });
});

gulp.task('dev', function() {
  return gulp.src('src/stepper.js')
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(babel({
      modules: 'umd',
      stage: 0,
    }))
      .on('error', gutil.log)
    .pipe(rename('stepper.dev.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./'))
    .on('end', function() {
      gutil.log('Babel finished');
    });
});

gulp.task('less', function() {
  gutil.log('Generating CSS files');
  return gulp.src('./examples/less/**/*.less')
    .pipe(less({
      paths: [path.join(__dirname, 'less', 'includes')]
    }))
    .pipe(gulp.dest('./examples/css'));
});

gulp.task('sass', function() {
  var cssSrc = './scss/';
  var cssDist = './css/';
  var cssFiles = cssSrc + '**/*.scss';

  gutil.log('Compiling SASS files ...');

  return gulp.src(cssFiles)
    .pipe(sass().on('error', gutil.log))
    .pipe(gulp.dest(cssDist));
});

