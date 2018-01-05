"use strict";

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _fsExtra = require("fs-extra");

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _redux = require("../../redux/");

var _path = require("../../utils/path");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const writeRedirects = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* () {
    bootstrapFinished = true;

    let { program, redirects } = _redux.store.getState();

    // Filter for redirects that are meant for the browser.
    const browserRedirects = redirects.filter(function (r) {
      return r.redirectInBrowser;
    });

    yield _fsExtra2.default.writeFile((0, _path.joinPath)(program.directory, `.cache/redirects.json`), JSON.stringify(browserRedirects, null, 2));
  });

  return function writeRedirects() {
    return _ref.apply(this, arguments);
  };
})();

exports.writeRedirects = writeRedirects;

let bootstrapFinished = false;
let oldRedirects;
const debouncedWriteRedirects = _lodash2.default.debounce(() => {
  // Don't write redirects again until bootstrap has finished.
  if (bootstrapFinished && !_lodash2.default.isEqual(oldRedirects, _redux.store.getState().redirects)) {
    writeRedirects();
    oldRedirects = _redux.store.getState().Redirects;
  }
}, 250);

_redux.emitter.on(`CREATE_REDIRECT`, () => {
  debouncedWriteRedirects();
});
//# sourceMappingURL=redirects-writer.js.map