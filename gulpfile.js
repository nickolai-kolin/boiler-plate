const { src, dest, task, series, parallel, watch } = require("gulp");
const remove = require("gulp-rm");
const concat = require("gulp-concat");

const browserSync = require("browser-sync").create();
var reload = browserSync.reload;

const pug = require("gulp-pug");

const sass = require("gulp-sass");
const sassGlob = require("gulp-sass-glob");
const px2rem = require("gulp-px2rem");
const sourcemaps = require("gulp-sourcemaps");
const autoprefixer = require("gulp-autoprefixer");
const cleanCSS = require("gulp-clean-css");
sass.compiler = require("node-sass");

const babel = require("gulp-babel");

const svgo = require("gulp-svgo");
const svgSprite = require("gulp-svg-sprite");
const imagemin = require("gulp-imagemin");

const SRC_PATH = "src";
const DIST_PATH = "dist";

// CONFIG

const CONFIG = {
  // Pug
  pugIndex: [`${SRC_PATH}/pug/pages/index.pug`],
  pugGlob: [`${SRC_PATH}/pug/**/*.pug`],
  // Sass
  sassIndex: [`${SRC_PATH}/sass/main.sass`],
  sassGlob: [`${SRC_PATH}/sass/**/*.sass`],
  sassLibs: [`node_modules/normalize.css/normalize.css`],
  // JS
  jsIndex: [`${SRC_PATH}/js/app.js`],
  jsGlob: [`${SRC_PATH}/js/**/*.js`],
  jsLibs: [],
  // IMG
  svgGlob: [`${SRC_PATH}/img/svg/**/*.svg`],
  imgGlob: [
    `${SRC_PATH}/img/**/*.jpg`,
    `${SRC_PATH}/img/**/*.jpeg`,
    `${SRC_PATH}/img/**/*.png`,
  ],
};

// Tasks

// Start browserSync server
task("server", () => {
  return browserSync.init({
    server: {
      baseDir: DIST_PATH,
    },
    port: 8000,
    open: false,
  });
});

// Remove all files in dist/
task("rm:dist", () => {
  return src(SRC_PATH, { read: false }).pipe(remove());
});

// Render Pug
task("pug:index", () => {
  return src(CONFIG.pugIndex)
    .pipe(pug())
    .pipe(dest(DIST_PATH), { overwrite: true })
    .pipe(reload({ stream: true }));
});

task("css:main", () => {
  return src(CONFIG.sassLibs.concat(CONFIG.sassIndex))
    .pipe(sourcemaps.init())
    .pipe(concat("main.css"))
    .pipe(sassGlob())
    .pipe(sass())
    .pipe(px2rem({ replace: true, mediaQuery: false, minPx: 2 }))
    .pipe(autoprefixer())
    .pipe(cleanCSS())
    .pipe(sourcemaps.write())
    .pipe(dest(DIST_PATH), { overwrite: true });
});

task("js:app", () => {
  return src(CONFIG.jsIndex.concat(CONFIG.jsLibs))
  .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(sourcemaps.write())
    .pipe(dest(DIST_PATH));
});



task("imagemin", () => {
  return src(CONFIG.imgGlob)
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 4 }),
      ])
    )
    .pipe(dest(DIST_PATH + "/img/"));
});

task("sprite", () => {
  return src(CONFIG.svgGlob)
    .pipe(
      svgo({
        plugins: [
          { removeAttrs: { attrs: "(fill|stroke|style|width|height|data.*)" } },
        ],
      })
    )
    .pipe(
      svgSprite({
        mode: {
          symbol: {
            sprite: "../sprite.svg",
          },
        },
      })
    )
    .pipe(dest(DIST_PATH + "/img/"));
});

task(
  "default",
  series(
    "rm:dist",
    parallel("pug:index", "css:main", "js:app", "sprite", "imagemin"),
    "server"
  )
);
watch(CONFIG.pugGlob, series("pug:index"));
watch(CONFIG.sassGlob, series("css:main", "pug:index"));
watch(CONFIG.jsGlob, series("js:app", "pug:index"));
watch(CONFIG.svgGlob, series("sprite", "pug:index"));
watch(CONFIG.imgGlob, series("imagemin", "pug:index"));
