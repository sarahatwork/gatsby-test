"use strict";

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const path = require(`path`);
const fs = require(`fs-extra`);

exports.createPages = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* ({ store, boundActionCreators }) {
    if (process.env.NODE_ENV !== `production`) {
      const { program } = store.getState();
      const { createPage } = boundActionCreators;
      const currentPath = path.join(__dirname, `./raw_dev-404-page.js`);
      const newPath = path.join(program.directory, `.cache`, `dev-404-page.js`);

      fs.copySync(currentPath, newPath);

      createPage({
        component: newPath,
        path: `/dev-404-page/`
      });
    }
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
})();
//# sourceMappingURL=gatsby-node.js.map