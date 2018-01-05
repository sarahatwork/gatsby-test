"use strict";

exports.__esModule = true;
exports.Runner = undefined;

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _glob = require("glob");

var _glob2 = _interopRequireDefault(_glob);

var _graphql = require("graphql");

var _relayCompiler = require("relay-compiler");

var _RelayParser = require("relay-compiler/lib/RelayParser");

var _RelayParser2 = _interopRequireDefault(_RelayParser);

var _ASTConvert = require("relay-compiler/lib/ASTConvert");

var _ASTConvert2 = _interopRequireDefault(_ASTConvert);

var _GraphQLCompilerContext = require("relay-compiler/lib/GraphQLCompilerContext");

var _GraphQLCompilerContext2 = _interopRequireDefault(_GraphQLCompilerContext);

var _filterContextForNode = require("relay-compiler/lib/filterContextForNode");

var _filterContextForNode2 = _interopRequireDefault(_filterContextForNode);

var _redux = require("../../redux");

var _fileParser = require("./file-parser");

var _fileParser2 = _interopRequireDefault(_fileParser);

var _GraphQLIRPrinter = require("relay-compiler/lib/GraphQLIRPrinter");

var _GraphQLIRPrinter2 = _interopRequireDefault(_GraphQLIRPrinter);

var _graphqlErrors = require("./graphql-errors");

var _reporter = require("gatsby-cli/lib/reporter");

var _reporter2 = _interopRequireDefault(_reporter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const normalize = require(`normalize-path`);

const _ = require(`lodash`);

const { printTransforms } = _relayCompiler.IRTransforms;

const {
  ArgumentsOfCorrectTypeRule,
  DefaultValuesOfCorrectTypeRule,
  FragmentsOnCompositeTypesRule,
  KnownTypeNamesRule,
  LoneAnonymousOperationRule,
  PossibleFragmentSpreadsRule,
  ScalarLeafsRule,
  VariablesAreInputTypesRule,
  VariablesInAllowedPositionRule
} = require(`graphql`);

const validationRules = [ArgumentsOfCorrectTypeRule, DefaultValuesOfCorrectTypeRule, FragmentsOnCompositeTypesRule, KnownTypeNamesRule, LoneAnonymousOperationRule, PossibleFragmentSpreadsRule, ScalarLeafsRule, VariablesAreInputTypesRule, VariablesInAllowedPositionRule];

class Runner {

  constructor(baseDir, fragmentsDir, schema) {
    this.baseDir = baseDir;
    this.fragmentsDir = fragmentsDir;
    this.schema = schema;
  }

  reportError(message) {
    _reporter2.default.log(`${_reporter2.default.format.red(`GraphQL Error`)} ${message}`);
  }

  compileAll() {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      let nodes = yield _this.parseEverything();
      return yield _this.write(nodes);
    })();
  }

  parseEverything() {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      // FIXME: this should all use gatsby's configuration to determine parsable
      // files (and how to parse them)
      let files = _glob2.default.sync(`${_this2.fragmentsDir}/**/*.+(t|j)s?(x)`);
      files = files.concat(_glob2.default.sync(`${_this2.baseDir}/**/*.+(t|j)s?(x)`));
      files = files.filter(function (d) {
        return !d.match(/\.d\.ts$/);
      });
      files = files.map(normalize);

      // Ensure all page components added as they're not necessarily in the
      // pages directory e.g. a plugin could add a page component.  Plugins
      // *should* copy their components (if they add a query) to .cache so that
      // our babel plugin to remove the query on building is active (we don't
      // run babel on code in node_modules). Otherwise the component will throw
      // an error in the browser of "graphql is not defined".
      files = files.concat(Object.keys(_redux.store.getState().components).map(function (c) {
        return normalize(c);
      }));
      files = _.uniq(files);

      let parser = new _fileParser2.default();

      return yield parser.parseFiles(files);
    })();
  }

  write(nodes) {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      const compiledNodes = new Map();
      const namePathMap = new Map();
      const nameDefMap = new Map();
      const documents = [];

      for (let [filePath, doc] of nodes.entries()) {
        let errors = (0, _graphql.validate)(_this3.schema, doc, validationRules);

        if (errors && errors.length) {
          _this3.reportError((0, _graphqlErrors.graphqlValidationError)(errors, filePath));
          return compiledNodes;
        }

        documents.push(doc);
        doc.definitions.forEach(function (def) {
          const name = def.name.value;
          namePathMap.set(name, filePath);
          nameDefMap.set(name, def);
        });
      }

      let compilerContext = new _GraphQLCompilerContext2.default(_this3.schema);
      try {
        compilerContext = compilerContext.addAll(_ASTConvert2.default.convertASTDocuments(_this3.schema, documents, validationRules, _RelayParser2.default.transform.bind(_RelayParser2.default)));
      } catch (error) {
        _this3.reportError((0, _graphqlErrors.graphqlError)(namePathMap, nameDefMap, error));
        return compiledNodes;
      }

      const printContext = printTransforms.reduce(function (ctx, transform) {
        return transform(ctx, _this3.schema);
      }, compilerContext);

      compilerContext.documents().forEach(function (node) {
        if (node.kind !== `Root`) return;

        const { name } = node;
        let filePath = namePathMap.get(name) || ``;

        if (compiledNodes.has(filePath)) {
          let otherNode = compiledNodes.get(filePath);
          _this3.reportError((0, _graphqlErrors.multipleRootQueriesError)(filePath, nameDefMap.get(name), otherNode && nameDefMap.get(otherNode.name)));
          return;
        }

        let text = (0, _filterContextForNode2.default)(printContext.getRoot(name), printContext).documents().map(_GraphQLIRPrinter2.default.print).join(`\n`);

        compiledNodes.set(filePath, {
          name,
          text,
          path: _path2.default.join(_this3.baseDir, filePath)
        });
      });

      return compiledNodes;
    })();
  }
}
exports.Runner = Runner;

exports.default = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* () {
    const { program, schema } = _redux.store.getState();

    const runner = new Runner(`${program.directory}/src`, `${program.directory}/.cache/fragments`, schema);

    const queries = yield runner.compileAll();

    return queries;
  });

  function compile() {
    return _ref.apply(this, arguments);
  }

  return compile;
})();
//# sourceMappingURL=query-compiler.js.map