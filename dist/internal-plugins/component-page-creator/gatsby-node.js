"use strict";

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const globCB = require(`glob`);
const Promise = require(`bluebird`);
const _ = require(`lodash`);
const chokidar = require(`chokidar`);
const systemPath = require(`path`);

const glob = Promise.promisify(globCB);

const createPath = require(`./create-path`);
const validatePath = require(`./validate-path`);

// Path creator.
// Auto-create pages.
// algorithm is glob /pages directory for js/jsx/cjsx files *not*
// underscored. Then create url w/ our path algorithm *unless* user
// takes control of that page component in gatsby-node.
exports.createPagesStatefully = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* ({ store, boundActionCreators }, options, doneCb) {
    const { createPage, deletePage } = boundActionCreators;
    const program = store.getState().program;
    const pagesDirectory = systemPath.posix.join(program.directory, `/src/pages`);
    const exts = program.extensions.map(function (e) {
      return `${e.slice(1)}`;
    }).join(`,`);

    // Get initial list of files.
    let files = yield glob(`${pagesDirectory}/**/?(${exts})`);
    files.forEach(function (file) {
      return _createPage(file, pagesDirectory, createPage);
    });

    // Listen for new component pages to be added or removed.
    chokidar.watch(`${pagesDirectory}/**/*.{${exts}}`).on(`add`, function (path) {
      if (!_.includes(files, path)) {
        _createPage(path, pagesDirectory, createPage);
        files.push(path);
      }
    }).on(`unlink`, function (path) {
      // Delete the page for the now deleted component.
      store.getState().pages.filter(function (p) {
        return p.component === path;
      }).forEach(function (page) {
        deletePage({
          path: createPath(pagesDirectory, path),
          component: path
        });
        files = files.filter(function (f) {
          return f !== path;
        });
      });
    }).on(`ready`, function () {
      return doneCb();
    });
  });

  return function (_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
})();
const _createPage = (filePath, pagesDirectory, createPage) => {
  // Filter out special components that shouldn't be made into
  // pages.
  if (!validatePath(systemPath.posix.relative(pagesDirectory, filePath))) {
    return;
  }

  // Create page object
  const page = {
    path: createPath(pagesDirectory, filePath),
    component: filePath

    // Add page
  };createPage(page);
};
//# sourceMappingURL=gatsby-node.js.map