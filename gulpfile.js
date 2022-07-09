const gulp       = require('gulp');
const uglify     = require('gulp-uglify');
const source     = require('vinyl-source-stream');
const browserify = require('browserify');

gulp.task('browserify', () => {
    return browserify({
            entries: ['./src/main.js']
        })
        .bundle()
        .pipe(source('main.js'))
        .pipe(gulp.dest('./dist/js/'));
})

gulp.task('compress', () => {
    return gulp.src('./dist/js/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('./dist/js/'));
})