"use strict";

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const webpack = require(`webpack`);
const fs = require(`fs`);
const webpackConfig = require(`../utils/webpack.config`);
const { store } = require(`../redux`);
const { createErrorFromString } = require(`gatsby-cli/lib/reporter/errors`);

const debug = require(`debug`)(`gatsby:html`);

module.exports = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (program) {
    const { directory } = program;

    debug(`generating static HTML`);
    // Reduce pages objects to an array of paths.
    const pages = store.getState().pages.map(function (page) {
      return page.path;
    });

    // Static site generation.
    const compilerConfig = yield webpackConfig(program, directory, `build-html`, null, pages);

    return new Promise(function (resolve, reject) {
      webpack(compilerConfig.resolve()).run(function (e, stats) {
        if (e) {
          return reject(e);
        }
        const outputFile = `${directory}/public/render-page.js`;
        if (stats.hasErrors()) {
          let webpackErrors = stats.toJson().errors.filter(Boolean);
          return reject(webpackErrors.length ? createErrorFromString(webpackErrors[0], `${outputFile}.map`) : new Error(`There was an issue while building the site: ` + `\n\n${stats.toString()}`));
        }

        // Remove the temp JS bundle file built for the static-site-generator-plugin
        try {
          fs.unlinkSync(outputFile);
        } catch (e) {
          // This function will fail on Windows with no further consequences.
        }
        return resolve(null, stats);
      });
    });
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
})();
//# sourceMappingURL=build-html.js.map