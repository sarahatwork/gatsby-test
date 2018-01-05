"use strict";

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const webpack = require(`webpack`);
const fs = require(`fs-extra`);
const webpackConfig = require(`../utils/webpack.config`);

module.exports = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (program) {
    const { directory } = program;

    const compilerConfig = yield webpackConfig(program, directory, `build-css`);

    return new Promise(function (resolve, reject) {
      webpack(compilerConfig.resolve()).run(function (err) {
        if (err) {
          reject(err);
        }

        // We don't want any javascript produced by this step in the process.
        try {
          fs.unlinkSync(`${directory}/public/bundle-for-css.js`);
        } catch (e) {}
        // ignore.


        // Ensure there's a styles.css file in public so tools that expect it
        // can find it.
        fs.ensureFile(`${directory}/public/styles.css`, function (err) {
          resolve(err);
        });
      });
    });
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
})();
//# sourceMappingURL=build-css.js.map