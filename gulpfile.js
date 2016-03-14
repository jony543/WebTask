var gulp = require('gulp');
var connect = require('gulp-connect');
var browserify = require('browserify')
var source = require('vinyl-source-stream')

gulp.task('connect', function () {
    connect.server({
        root: 'public',
        port: 4000
    });
});

gulp.task('browserify', function() {
    return browserify('./web/js/app.js')
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./public'));
});

gulp.task('boostFractals', function() {
    return browserify('./web/js/boost_fractals.js', { standalone: 'exp' })
        .bundle()
        .pipe(source('boost_fractals.js'))
        .pipe(gulp.dest('./public'));
});

gulp.task('browserifyCommon', function() {
    return browserify(['./common/common.js'], { standalone: "common" })
        .bundle()
        .pipe(source('common.js'))
        .pipe(gulp.dest('./public'));
});

gulp.task('copyHTML', function() {
    gulp.src('web/**/*.html')
        .pipe(gulp.dest('./public'));
});

gulp.task('copyResources', function() {
    gulp.src('web/resources/*.*')
        .pipe(gulp.dest('./public/resources'))
});

gulp.task('watch', function() {
    gulp.watch('web/**/*.js', ['browserify']);
    gulp.watch('common/**/*.js', ['browserifyCommon']);
    gulp.watch('web/**/*.html', ['copyHTML']);
    gulp.watch('web/resources/*.*', ['copyResources']);
});

gulp.task('watchBF', function() {
    gulp.watch('web/**/*.html', ['copyHTML']);
    gulp.watch('common/**/*.js', ['browserifyCommon']);
    gulp.watch('web/**/*.js', ['boostFractals']);
});

gulp.task('BF', ['copyHTML', 'browserifyCommon', 'boostFractals', 'watchBF']);

gulp.task('default', ['copyHTML', 'browserify', 'browserifyCommon', 'watch']); //'connect', (before watch)
