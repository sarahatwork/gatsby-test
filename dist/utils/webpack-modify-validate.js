"use strict";

exports.__esModule = true;

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _webpackValidator = require("webpack-validator");

var _webpackValidator2 = _interopRequireDefault(_webpackValidator);

var _stripIndent = require("common-tags/lib/stripIndent");

var _stripIndent2 = _interopRequireDefault(_stripIndent);

var _apiRunnerNode = require("./api-runner-node");

var _apiRunnerNode2 = _interopRequireDefault(_apiRunnerNode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// We whitelist special config keys that are not part of a standard Webpack v1
// config but are in common usage. We should be able to completely remove this
// once we're on Webpack v3.
//
// For info on whitelisting with webpack-validator see:
// https://github.com/js-dxtools/webpack-validator#customizing
const validationWhitelist = _webpackValidator.Joi.object({
  stylus: _webpackValidator.Joi.any(),
  sassLoader: _webpackValidator.Joi.any(),
  sassResources: [_webpackValidator.Joi.string(), _webpackValidator.Joi.array().items(_webpackValidator.Joi.string())],
  responsiveLoader: _webpackValidator.Joi.any()
});

exports.default = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (config, stage) {
    // We don't care about the return as plugins just mutate the config directly.
    yield (0, _apiRunnerNode2.default)(`modifyWebpackConfig`, { config, stage });

    // console.log(JSON.stringify(config, null, 4))

    (0, _invariant2.default)(_lodash2.default.isObject(config) && _lodash2.default.isFunction(config.resolve), `
    You must return an webpack-configurator instance when modifying the Webpack config.
    Returned: ${config}
    stage: ${stage}
    `);

    const validationState = (0, _webpackValidator2.default)(config.resolve(), {
      returnValidation: true,
      schemaExtension: validationWhitelist
    });

    if (!validationState.error) {
      return config;
    }

    console.log(`There were errors with your webpack config:`);
    validationState.error.details.forEach(function (err, index) {
      console.log(`[${index + 1}]`);
      console.log(err.path);
      console.log(err.type, `,`, err.message);
      console.log(`\n`);
    });

    console.log(_stripIndent2.default`
    Your Webpack config does not appear to be valid. This could be because of
    something you added or a plugin. If you don't recognize the invalid keys listed
    above try removing plugins and rebuilding to identify the culprit.
  `);

    return process.exit(1);
  });

  function ValidateWebpackConfig(_x, _x2) {
    return _ref.apply(this, arguments);
  }

  return ValidateWebpackConfig;
})();
//# sourceMappingURL=webpack-modify-validate.js.map