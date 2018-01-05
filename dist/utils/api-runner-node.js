"use strict";

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Promise = require(`bluebird`);
const glob = require(`glob`);
const _ = require(`lodash`);
const mapSeries = require(`async/mapSeries`);

const reporter = require(`gatsby-cli/lib/reporter`);
const cache = require(`./cache`);
const apiList = require(`./api-node-docs`);

// Bind action creators per plugin so we can auto-add
// metadata to actions they create.
const boundPluginActionCreators = {};
const doubleBind = (boundActionCreators, api, plugin, { traceId }) => {
  if (boundPluginActionCreators[plugin.name + api + traceId]) {
    return boundPluginActionCreators[plugin.name + api + traceId];
  } else {
    const keys = Object.keys(boundActionCreators);
    const doubleBoundActionCreators = {};
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const boundActionCreator = boundActionCreators[key];
      if (typeof boundActionCreator === `function`) {
        doubleBoundActionCreators[key] = (...args) => {
          // Let action callers override who the plugin is. Shouldn't be used
          // that often.
          if (args.length === 1) {
            boundActionCreator(args[0], plugin, traceId);
          } else if (args.length === 2) {
            boundActionCreator(args[0], args[1], traceId);
          }
        };
      }
    }
    boundPluginActionCreators[plugin.name + api + traceId] = doubleBoundActionCreators;
    return doubleBoundActionCreators;
  }
};

const runAPI = (plugin, api, args) => {
  let pathPrefix = ``;
  const {
    store,
    loadNodeContent,
    getNodes,
    getNode,
    hasNodeChanged,
    getNodeAndSavePathDependency
  } = require(`../redux`);
  const { boundActionCreators } = require(`../redux/actions`);

  const doubleBoundActionCreators = doubleBind(boundActionCreators, api, plugin, args);

  if (store.getState().program.prefixPaths) {
    pathPrefix = store.getState().config.pathPrefix;
  }

  const gatsbyNode = require(`${plugin.resolve}/gatsby-node`);
  if (gatsbyNode[api]) {
    const apiCallArgs = [(0, _extends3.default)({}, args, {
      pathPrefix,
      boundActionCreators: doubleBoundActionCreators,
      loadNodeContent,
      store,
      getNodes,
      getNode,
      hasNodeChanged,
      reporter,
      getNodeAndSavePathDependency,
      cache
    }), plugin.pluginOptions];

    // If the plugin is using a callback use that otherwise
    // expect a Promise to be returned.
    if (gatsbyNode[api].length === 3) {
      return Promise.fromCallback(callback => gatsbyNode[api](...apiCallArgs, callback));
    } else {
      const result = gatsbyNode[api](...apiCallArgs);
      return Promise.resolve(result);
    }
  }

  return null;
};

let filteredPlugins;
const hasAPIFile = plugin => glob.sync(`${plugin.resolve}/gatsby-node*`)[0];

let apisRunning = [];
let waitingForCasacadeToFinish = [];

module.exports = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (api, args = {}, pluginSource) {
    return new Promise(function (resolve) {
      // Check that the API is documented.
      if (!apiList[api]) {
        reporter.error(`api: "${api}" is not a valid Gatsby api`);
        process.exit();
      }

      const { store } = require(`../redux`);
      const plugins = store.getState().flattenedPlugins;
      // Get the list of plugins that implement gatsby-node
      if (!filteredPlugins) {
        filteredPlugins = plugins.filter(function (plugin) {
          return hasAPIFile(plugin);
        });
      }

      // Break infinite loops.
      // Sometimes a plugin will implement an API and call an
      // action which will trigger the same API being called.
      // "onCreatePage" is the only example right now.
      // In these cases, we should avoid calling the originating plugin
      // again.
      let noSourcePluginPlugins = filteredPlugins;
      if (pluginSource) {
        noSourcePluginPlugins = filteredPlugins.filter(function (p) {
          return p.name !== pluginSource;
        });
      }

      const apiRunInstance = {
        api,
        args,
        pluginSource,
        resolve,
        startTime: new Date().toJSON(),
        traceId: args.traceId
      };

      if (args.waitForCascadingActions) {
        waitingForCasacadeToFinish.push(apiRunInstance);
      }

      apisRunning.push(apiRunInstance);

      let currentPluginName = null;

      mapSeries(noSourcePluginPlugins, function (plugin, callback) {
        currentPluginName = plugin.name;
        Promise.resolve(runAPI(plugin, api, args)).asCallback(callback);
      }, function (err, results) {
        if (err) {
          reporter.error(`Plugin ${currentPluginName} returned an error`, err);
        }
        // Remove runner instance
        apisRunning = apisRunning.filter(function (runner) {
          return runner !== apiRunInstance;
        });

        if (apisRunning.length === 0) {
          const { emitter } = require(`../redux`);
          emitter.emit(`API_RUNNING_QUEUE_EMPTY`);
        }

        // Filter empty results
        apiRunInstance.results = results.filter(function (result) {
          return !_.isEmpty(result);
        });

        // Filter out empty responses and return if the
        // api caller isn't waiting for cascading actions to finish.
        if (!args.waitForCascadingActions) {
          resolve(apiRunInstance.results);
        }

        // Check if any of our waiters are done.
        waitingForCasacadeToFinish = waitingForCasacadeToFinish.filter(function (instance) {
          // If none of its trace IDs are running, it's done.
          if (!_.some(apisRunning, function (a) {
            return a.traceId === instance.traceId;
          })) {
            instance.resolve(instance.results);
            return false;
          } else {
            return true;
          }
        });
      });
    });
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
})();
//# sourceMappingURL=api-runner-node.js.map