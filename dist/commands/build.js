"use strict";

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const report = require(`gatsby-cli/lib/reporter`);
const buildCSS = require(`./build-css`);
const buildHTML = require(`./build-html`);
const buildProductionBundle = require(`./build-javascript`);
const bootstrap = require(`../bootstrap`);
const apiRunnerNode = require(`../utils/api-runner-node`);
const copyStaticDirectory = require(`../utils/copy-static-directory`);

function reportFailure(msg, err) {
  report.log(``);
  report.panic(msg, err);
}

module.exports = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (program) {
    const { graphqlRunner } = yield bootstrap(program);

    yield apiRunnerNode(`onPreBuild`, { graphql: graphqlRunner });

    // Copy files from the static directory to
    // an equivalent static directory within public.
    copyStaticDirectory();

    let activity;
    activity = report.activityTimer(`Building CSS`);
    activity.start();
    yield buildCSS(program).catch(function (err) {
      reportFailure(`Generating CSS failed`, err);
    });
    activity.end();

    activity = report.activityTimer(`Building production JavaScript bundles`);
    activity.start();
    yield buildProductionBundle(program).catch(function (err) {
      reportFailure(`Generating JavaScript bundles failed`, err);
    });
    activity.end();

    activity = report.activityTimer(`Building static HTML for pages`);
    activity.start();
    yield buildHTML(program).catch(function (err) {
      reportFailure(report.stripIndent`
        Building static HTML for pages failed

        See our docs page on debugging HTML builds for help https://goo.gl/yL9lND
      `, err);
    });
    activity.end();

    yield apiRunnerNode(`onPostBuild`, { graphql: graphqlRunner });

    report.info(`Done building in ${process.uptime()} sec`);
  });

  function build(_x) {
    return _ref.apply(this, arguments);
  }

  return build;
})();
//# sourceMappingURL=build.js.map