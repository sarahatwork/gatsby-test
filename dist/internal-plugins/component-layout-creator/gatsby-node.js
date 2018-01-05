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

const validatePath = require(`./validate-path`);

// Path creator.
// Auto-create layouts.
// algorithm is glob /layouts directory for js/jsx/cjsx files *not*
// underscored
exports.createLayouts = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* ({ store, boundActionCreators }, options, doneCb) {
    const { createLayout, deleteLayout } = boundActionCreators;
    const program = store.getState().program;
    const layoutDirectory = systemPath.posix.join(program.directory, `/src/layouts`);
    const exts = program.extensions.map(function (e) {
      return `${e.slice(1)}`;
    }).join(`,`);

    // Get initial list of files.
    let files = yield glob(`${layoutDirectory}/**/?(${exts})`);
    files.forEach(function (file) {
      return _createLayout(file, layoutDirectory, createLayout);
    });

    // Listen for new layouts to be added or removed.
    chokidar.watch(`${layoutDirectory}/**/*.{${exts}}`).on(`add`, function (path) {
      if (!_.includes(files, path)) {
        _createLayout(path, layoutDirectory, createLayout);
        files.push(path);
      }
    }).on(`unlink`, function (path) {
      // Delete the layout for the now deleted component.
      store.getState().layouts.filter(function (p) {
        return p.component === path;
      }).forEach(function (layout) {
        deleteLayout({ name: layout.name });
        files = files.filter(function (f) {
          return f !== layout.name;
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
const _createLayout = (filePath, layoutDirectory, createLayout) => {
  // Filter out special components that shouldn't be made into
  // layouts.
  if (!validatePath(systemPath.posix.relative(layoutDirectory, filePath))) {
    return;
  }

  // Create layout object
  const layout = {
    component: filePath

    // Add layout
  };createLayout(layout);
};
//# sourceMappingURL=gatsby-node.js.map