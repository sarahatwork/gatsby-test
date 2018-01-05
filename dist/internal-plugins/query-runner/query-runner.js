"use strict";

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _graphql = require("graphql");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const fs = require(`fs-extra`);
const report = require(`gatsby-cli/lib/reporter`);
const md5 = require(`md5`);

const { joinPath } = require(`../../utils/path`);
const { store } = require(`../../redux`);

const resultHashes = {};

// Run query for a page
module.exports = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (pageOrLayout, component) {
    pageOrLayout.id = pageOrLayout._id;
    const { schema, program } = store.getState();

    const graphql = function (query, context) {
      return (0, _graphql.graphql)(schema, query, context, context, context);
    };

    // Run query
    let result;

    // Nothing to do if the query doesn't exist.
    if (!component.query || component.query === ``) {
      result = {};
    } else {
      result = yield graphql(component.query, (0, _extends3.default)({}, pageOrLayout, pageOrLayout.context));
    }

    // If there's a graphql error then log the error. If we're building, also
    // quit.
    if (result && result.errors) {
      report.log(report.stripIndent`
        The GraphQL query from ${component.componentPath} failed

        Errors:
          ${result.errors || []}
        Query:
          ${component.query}
      `);

      // Perhaps this isn't the best way to see if we're building?
      if (program._name === `build`) {
        process.exit(1);
      }
    }

    // Add the path/layout context onto the results.
    let contextKey = `pathContext`;
    if (!pageOrLayout.path) {
      contextKey = `layoutContext`;
    }
    result[contextKey] = pageOrLayout.context;
    const resultJSON = JSON.stringify(result);
    const resultHash = md5(resultJSON);
    const resultPath = joinPath(program.directory, `.cache`, `json`, pageOrLayout.jsonName);

    if (resultHashes[resultPath] !== resultHash) {
      resultHashes[resultPath] = resultHash;
      yield fs.writeFile(resultPath, resultJSON);
    }
  });

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();
//# sourceMappingURL=query-runner.js.map