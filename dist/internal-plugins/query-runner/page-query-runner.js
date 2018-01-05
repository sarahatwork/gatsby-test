"use strict";

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Jobs of this module
 * - Ensure on bootstrap that all invalid page queries are run and report
 *   when this is done
 * - Watch for when a page's query is invalidated and re-run it.
 */

const _ = require(`lodash`);

const queue = require(`./query-queue`);
const { store, emitter } = require(`../../redux`);

let queuedDirtyActions = [];
let active = false;

// Do initial run of graphql queries during bootstrap.
// Afterwards we listen "API_RUNNING_QUEUE_EMPTY" and check
// for dirty nodes before running queries.
exports.runQueries = (0, _asyncToGenerator3.default)(function* () {
  // Run queued dirty nodes now that we're active.
  queuedDirtyActions = _.uniq(queuedDirtyActions, function (a) {
    return a.payload.id;
  });
  const dirtyIds = findDirtyIds(queuedDirtyActions);
  yield runQueriesForIds(dirtyIds);

  queuedDirtyActions = [];

  // Find ids without data dependencies (i.e. no queries have been run for
  // them before) and run them.
  const cleanIds = findIdsWithoutDataDependencies();

  // Run these pages
  yield runQueriesForIds(cleanIds);

  active = true;
  return;
});

emitter.on(`CREATE_NODE`, action => {
  queuedDirtyActions.push(action);
});

emitter.on(`DELETE_NODE`, action => {
  queuedDirtyActions.push({ payload: action.node });
});

const runQueuedActions = (() => {
  var _ref2 = (0, _asyncToGenerator3.default)(function* () {
    if (active) {
      queuedDirtyActions = _.uniq(queuedDirtyActions, function (a) {
        return a.payload.id;
      });
      yield runQueriesForIds(findDirtyIds(queuedDirtyActions));
      queuedDirtyActions = [];

      // Find ids without data dependencies (e.g. new pages) and run
      // their queries.
      const cleanIds = findIdsWithoutDataDependencies();
      runQueriesForIds(cleanIds);
    }
  });

  return function runQueuedActions() {
    return _ref2.apply(this, arguments);
  };
})();

// Wait until all plugins have finished running (e.g. various
// transformer plugins) before running queries so we don't
// query things in a 1/2 finished state.
emitter.on(`API_RUNNING_QUEUE_EMPTY`, runQueuedActions);

let seenIdsWithoutDataDependencies = [];
const findIdsWithoutDataDependencies = () => {
  const state = store.getState();
  const allTrackedIds = _.uniq(_.flatten(_.concat(_.values(state.componentDataDependencies.nodes), _.values(state.componentDataDependencies.connections))));

  // Get list of paths not already tracked and run the queries for these
  // paths.
  const notTrackedIds = _.difference([...state.pages.map(p => p.path), ...state.layouts.map(l => `LAYOUT___${l.id}`)], [...allTrackedIds, ...seenIdsWithoutDataDependencies]);

  // Add new IDs to our seen array so we don't keep trying to run queries for them.
  // Pages/Layouts without queries can't be tracked.
  seenIdsWithoutDataDependencies = _.uniq([...notTrackedIds, ...seenIdsWithoutDataDependencies]);

  return notTrackedIds;
};

const runQueriesForIds = ids => {
  const state = store.getState();
  const pagesAndLayouts = [...state.pages, ...state.layouts];
  let didNotQueueItems = true;
  ids.forEach(id => {
    const plObj = pagesAndLayouts.find(pl => pl.path === id || `LAYOUT___${pl.id}` === id);
    if (plObj) {
      didNotQueueItems = false;
      queue.push((0, _extends3.default)({}, plObj, { _id: plObj.id, id: plObj.jsonName }));
    }
  });

  if (didNotQueueItems || !ids || ids.length === 0) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    queue.on(`drain`, () => {
      resolve();
    });
  });
};

const findDirtyIds = actions => {
  const state = store.getState();
  return actions.reduce((dirtyIds, action) => {
    const node = action.payload;

    // find invalid pagesAndLayouts
    dirtyIds = dirtyIds.concat(state.componentDataDependencies.nodes[node.id]);

    // Find invalid connections
    dirtyIds = dirtyIds.concat(state.componentDataDependencies.connections[node.internal.type]);

    return _.compact(dirtyIds);
  }, []);
};
//# sourceMappingURL=page-query-runner.js.map