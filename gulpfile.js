// 1. LIBRARIES
// - - - - - - - - - - - - - - -

var gulp           = require('gulp'),
    rimraf         = require('rimraf'),
    runSequence    = require('run-sequence'),
    frontMatter    = require('gulp-front-matter'),
    autoprefixer   = require('gulp-autoprefixer'),
    sass           = require('gulp-sass'),
    uglify         = require('gulp-uglify'),
    concat         = require('gulp-concat'),
    watch          = require('gulp-watch'),
    data           = require('gulp-data'),
    browserSync    = require('browser-sync'),
    reload         = browserSync.reload,
    path           = require('path'),
    swig           = require('gulp-swig'),
    nunjucksRender = require('gulp-nunjucks-render'),
    modRewrite     = require('connect-modrewrite');


// 2. SETTINGS VARIABLES
// - - - - - - - - - - - - - - -

// Sass will check these folders for files when you use @import.
var sassPaths = [
  'bower_components/foundation/scss',
  'client/assets/scss'
];
// These files include Foundation for Apps and its dependencies
var foundationJS = [
  'bower_components/foundation/js/vendor/jquery.js',
  'bower_components/foundation/js/vendor/**/*.js',
  'bower_components/foundation/js/foundation/foundation.js',
  'bower_components/foundation/js/foundation/foundation.orbit.js',
  'bower_components/foundation/js/foundation/foundation.topbar.js'
];
// These files are for your app's JavaScript
var appJS = [
  'client/assets/js/app.js'
];
// Static files
var STATIC_FILES = [
  './client/**/*.*',
  '!./client/views/layout.html',
  '!./client/views/_*.html',
  '!./client/views/templates/**/*.*',
  '!./client/assets/{scss,js}/**/*.*'
];
// JS & SASS files
var JS_FILES = [
  './client/assets/js/**/*', 
  './js/**/*'
];
var SASS_FILES = [
  './client/assets/scss/**/*', 
  './scss/**/*'
];

// 3. TASKS
// - - - - - - - - - - - - - - -

// Clean build directory
gulp.task('clean', function(cb) {
  rimraf('./build', cb);
});

// Copies user-created files and Foundation assets
gulp.task('copy', function() {
  // Everything in the client folder except templates, Sass, and JS
  gulp.src(STATIC_FILES, {
    base: './client/'
  })
    .pipe(gulp.dest('./build'));
});

// Copies your app's templates templates and generates URLs for them
gulp.task('copy-templates', ['copy'], function() {
  return gulp.src('./client/views/templates/**/*.html')
    .pipe(gulp.dest('./build/templates'));
});

// Compiles and copies the Foundation for Apps JavaScript, as well as your app's custom JS
gulp.task('uglify', function() {
  // Foundation JavaScript
  gulp.src(foundationJS)
    .pipe(uglify({
      beautify: true,
      mangle: false
    }).on('error', function(e) {
      console.log(e);
    }))
    .pipe(concat('foundation.js'))
    .pipe(gulp.dest('./build/assets/js/'))
  ;

  // App JavaScript
  return gulp.src(appJS)
    .pipe(uglify({
      beautify: true,
      mangle: false
    }).on('error', function(e) {
      console.log(e);
    }))
    .pipe(concat('app.js'))
    .pipe(gulp.dest('./build/assets/js/'))
  ;
});

// Compiles Sass
gulp.task('sass', function() {
  return gulp.src('client/assets/scss/app.scss')
    .pipe(sass({
      loadPath: sassPaths,
      includePaths: sassPaths,
      style: 'nested',
      bundleExec: true
    }))
    .on('error', function(e) {
      console.log(e);
    })
    .pipe(autoprefixer({
      browsers: ['last 2 versions', 'ie 10']
    }))
    .pipe(gulp.dest('./build/assets/css/'));
});

gulp.task('layout', function () {
  nunjucksRender.nunjucks.configure(['client/views']);
  return gulp.src(['./client/views/templates/*.html', '!./client/views/layout.html', '!./client/views/_*.html'])
    .pipe(frontMatter())
    .pipe(data(function(file) {
      return file.frontMatter;
    }))
    .pipe(nunjucksRender())
    .pipe(gulp.dest('./build/pages'));
});

// Starts a test server, which you can view at http://localhost:8080
gulp.task('server:start', function() {
  browserSync({
    open: false,
    notify: false,
    server: {
      baseDir: "./build",
      middleware: [
        modRewrite([
          '^[^\\.]*$ /pages/home.html [L]',
          ]
        )
      ]
    }
  })
});

// Builds your entire app once, without starting a server
gulp.task('build', function() {
  runSequence('clean', ['copy', 'sass', 'uglify', 'layout'], function() {
    console.log("Successfully built.");
  })
});

gulp.task('default', ['build', 'server:start'], function() {
  // Watch Sass
  watch(SASS_FILES                  , function() {
    gulp.start('sass'  , reload);
  });
  // Watch JavaScript
  watch(JS_FILES                    , function() {
    gulp.start('uglify', reload);
  });
  // Watch Static files
  watch(STATIC_FILES                , function() { 
    gulp.start('copy'  , reload);
  });
  // Watch Layout/View files
  watch(['./client/views/**/*.html'], function() { 
    gulp.start('layout', reload);
  });
});
