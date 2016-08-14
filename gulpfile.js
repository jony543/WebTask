var gulp = require('gulp');
var uglify = require('gulp-uglify');
var connect = require('gulp-connect');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var babel = require('gulp-babel');

gulp.task('connect', function () {
    connect.server({
        root: 'public',
        port: 4000
    });
});

gulp.task('browserify', function() {
    return browserify('./web/js/app.js', { standalone: 'app' })
        .bundle()
        .pipe(source('app.js'))
        .pipe(gulp.dest('./public'));
});

gulp.task('browserifyMin', function() {
    return browserify('./web/js/app.js', { standalone: 'app' })
        .bundle()
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(uglify().on('error', gutil.log))
        .pipe(gulp.dest('./public'));
});

gulp.task('boostFractals', function() {
    return browserify('./web/js/experiments/boost_fractals.js', { standalone: 'exp' })
        .bundle()
        .pipe(source('boost_fractals.js'))
        .pipe(gulp.dest('./public'));
});

gulp.task('boostFractalsMin', function() {
    return browserify('./web/js/experiments/boost_fractals.js', { standalone: 'exp' })
        .bundle()
        .pipe(source('boost_fractals.js'))
        .pipe(buffer())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(uglify().on('error', gutil.log))
        .pipe(gulp.dest('./public'));
});

gulp.task('browserifyCommon', function() {
    return browserify(['./common/common.js'], { standalone: "common" })
        .bundle()
        .pipe(source('common.js'))
        .pipe(gulp.dest('./public'));
});

gulp.task('browserifyCommonMin', function() {
    return browserify(['./common/common.js'], { standalone: "common" })
        .bundle()
        .pipe(source('common.js'))
        .pipe(buffer())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(uglify())
        .pipe(gulp.dest('./public'));
});

gulp.task('copyHTML', function() {
    gulp.src('web/**/*.html')
        .pipe(gulp.dest('./public'));
});

gulp.task('copyCSS', function() {
    gulp.src('web/**/*.css')
        .pipe(gulp.dest('./public'));
});

//gulp.task('copyResources', function() {
//    gulp.src('web/resources/*.*')
//        .pipe(gulp.dest('./public/resources'))
//});

gulp.task('watch', function() {
    gulp.watch('web/**/*.js', ['browserify']);
    gulp.watch('common/**/*.js', ['browserifyCommon']);
    gulp.watch('web/**/*.html', ['copyHTML']);
    gulp.watch('web/**/*.css', ['copyCSS']);
    //gulp.watch('web/resources/*.*', ['copyResources']);
});

gulp.task('watchBFMin', function() {
    gulp.watch('web/**/*.html', ['copyHTML']);
    gulp.watch('web/**/*.css', ['copyCSS']);
    gulp.watch('common/**/*.js', ['browserifyCommonMin']);
    gulp.watch('web/**/*.js', ['boostFractalsMin']);
});

gulp.task('watchBF', function() {
    gulp.watch('web/**/*.html', ['copyHTML']);
    gulp.watch('web/**/*.css', ['copyCSS']);
    gulp.watch('common/**/*.js', ['browserifyCommon']);
    gulp.watch('web/**/*.js', ['browserify']);
});

gulp.task('BF', ['copyHTML', 'copyCSS', 'browserify', 'browserifyCommon', 'watchBF']);
gulp.task('BFmin', ['copyHTML', 'copyCSS', 'browserifyCommonMin', 'boostFractalsMin', 'watchBFMin']);

gulp.task('prod', ['copyHTML', 'copyCSS', 'browserifyCommonMin', 'browserifyMin']);

gulp.task('default', ['copyHTML', 'copyCSS', 'browserify', 'browserifyCommon', 'watch']); //'connect', (before watch)
