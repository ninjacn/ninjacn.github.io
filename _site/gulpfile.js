var gulp = require('gulp'),
    notify = require('gulp-notify'),
    concat = require('gulp-concat');

gulp.task('default', function() {
    gulp.start('concatScripts');
    gulp.start('concatStyle');
    gulp.start('concatStyleIe');
    gulp.start('copyImages');
});

gulp.task('concatScripts', function() {
  return gulp.src([
      'node_modules/jquery/dist/jquery.min.js',
      'node_modules/bootstrap/dist/js/bootstrap.min.js',
      'resource/js/main.js'
    ])
    .pipe(concat('ninjacn.js'))
    .pipe(gulp.dest('static/js/'))
});
gulp.task('concatStyle', function() {
  return gulp.src([
      'node_modules/bootstrap/dist/css/bootstrap.min.css',
      'resource/css/gh-fork-ribbon.min.css',
      'resource/css/main.css'
    ])
    .pipe(concat('ninjacn.css'))
    .pipe(gulp.dest('static/css/'))
});
gulp.task('concatStyleIe', function() {
  return gulp.src([
      'node_modules/bootstrap/dist/css/bootstrap.min.css',
      'resource/css/gh-fork-ribbon.ie.min.css',
    ])
    .pipe(concat('ninjacn-ie.css'))
    .pipe(gulp.dest('static/css/'))
});
gulp.task('copyImages', function() {
  return gulp.src([
      'resource/img/*',
    ])
    .pipe(gulp.dest('static/img/'))
});
