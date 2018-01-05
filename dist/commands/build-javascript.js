"use strict";

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const webpack = require(`webpack`);
const webpackConfig = require(`../utils/webpack.config`);

module.exports = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (program) {
    const { directory } = program;

    const compilerConfig = yield webpackConfig(program, directory, `build-javascript`);

    return new Promise(function (resolve) {
      webpack(compilerConfig.resolve()).run(function () {
        return resolve();
      });
    });
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
})();
//# sourceMappingURL=build-javascript.js.map