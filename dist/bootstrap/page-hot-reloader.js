"use strict";

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const _ = require(`lodash`);

const { emitter, store } = require(`../redux`);
const apiRunnerNode = require(`../utils/api-runner-node`);
const { boundActionCreators } = require(`../redux/actions`);
const { deletePage, deleteComponentsDependencies } = boundActionCreators;

let pagesDirty = false;
let graphql;

emitter.on(`CREATE_NODE`, action => {
  if (action.payload.internal.type !== `SitePage`) {
    pagesDirty = true;
  }
});
emitter.on(`DELETE_NODE`, action => {
  pagesDirty = true;
  debouncedCreatePages();
});

emitter.on(`API_RUNNING_QUEUE_EMPTY`, () => {
  if (pagesDirty) {
    debouncedCreatePages();
  }
});

const runCreatePages = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* () {
    pagesDirty = false;
    const plugins = store.getState().plugins;
    // Test which plugins implement createPagesStatefully so we can
    // ignore their pages.
    const statefulPlugins = plugins.filter(function (p) {
      try {
        const gatsbyNode = require(`${p.resolve}/gatsby-node`);
        if (gatsbyNode.createPagesStatefully) {
          return true;
        } else {
          return false;
        }
      } catch (e) {
        return false;
      }
    }).map(function (p) {
      return p.id;
    });

    const timestamp = new Date().toJSON();

    yield apiRunnerNode(`createPages`, {
      graphql,
      traceId: `createPages`,
      waitForCascadingActions: true
    });

    // Delete pages that weren't updated when running createPages.
    store.getState().pages.filter(function (p) {
      return !_.includes(statefulPlugins, p.pluginCreatorId);
    }).filter(function (p) {
      return p.updatedAt < timestamp;
    }).forEach(function (page) {
      deleteComponentsDependencies([page.path]);
      deletePage(page);
    });

    emitter.emit(`CREATE_PAGE_END`);
  });

  return function runCreatePages() {
    return _ref.apply(this, arguments);
  };
})();

const debouncedCreatePages = _.debounce(runCreatePages, 100);

module.exports = graphqlRunner => {
  graphql = graphqlRunner;
};
//# sourceMappingURL=page-hot-reloader.js.map