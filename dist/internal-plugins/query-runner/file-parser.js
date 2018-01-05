"use strict";

exports.__esModule = true;

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let parseToAst = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (filePath, fileStr) {
    let ast;

    // Preprocess and attempt to parse source; return an AST if we can, log an
    // error if we can't.
    const transpiled = yield apiRunnerNode(`preprocessSource`, {
      filename: filePath,
      contents: fileStr
    });

    if (transpiled && transpiled.length) {
      for (const item of transpiled) {
        try {
          const tmp = babylon.parse(item, {
            sourceType: `module`,
            plugins: [`*`]
          });
          ast = tmp;
          break;
        } catch (error) {
          report.error(error);
          continue;
        }
      }
      if (ast === undefined) {
        report.error(`Failed to parse preprocessed file ${filePath}`);
      }
    } else {
      try {
        ast = babylon.parse(fileStr, {
          sourceType: `module`,
          sourceFilename: true,
          plugins: [`*`]
        });
      } catch (error) {
        report.error(`There was a problem parsing "${filePath}"; any GraphQL ` + `fragments or queries in this file were not processed. \n` + `This may indicate a syntax error in the code, or it may be a file type ` + `That Gatsby does not know how to parse.`);
      }
    }

    return ast;
  });

  return function parseToAst(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

let findGraphQLTags = (() => {
  var _ref2 = (0, _asyncToGenerator3.default)(function* (file, text) {
    return new Promise(function (resolve, reject) {
      parseToAst(file, text).then(function (ast) {
        let queries = [];
        if (!ast) {
          resolve(queries);
          return;
        }

        (0, _babelTraverse2.default)(ast, {
          ExportNamedDeclaration(path, state) {
            path.traverse({
              TaggedTemplateExpression(innerPath) {
                const gqlAst = getGraphQLTag(innerPath);
                if (gqlAst) {
                  gqlAst.definitions.forEach(def => {
                    if (!def.name || !def.name.value) {
                      report.panic(getMissingNameErrorMessage(file));
                    }
                  });

                  queries.push(...gqlAst.definitions);
                }
              }
            });
          }
        });
        resolve(queries);
      }).catch(reject);
    });
  });

  return function findGraphQLTags(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
})();

var _babelTraverse = require("babel-traverse");

var _babelTraverse2 = _interopRequireDefault(_babelTraverse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const fs = require(`fs-extra`);
const crypto = require(`crypto`);

// Traverse is a es6 module...

const babylon = require(`babylon`);

const report = require(`gatsby-cli/lib/reporter`);
const { getGraphQLTag } = require(`../../utils/babel-plugin-extract-graphql`);

const apiRunnerNode = require(`../../utils/api-runner-node`);

const getMissingNameErrorMessage = file => report.stripIndent`
  GraphQL definitions must be "named".
  The query with the missing name is in ${file}.
  To fix the query, add "query MyQueryName" to the start of your query.
  So instead of:
    {
      allMarkdownRemark {
        totalCount
      }
    }

  Do:
    query MyQueryName {
      allMarkdownRemark {
        totalCount
      }
    }
`;


const cache = {};

class FileParser {
  parseFile(file) {
    return (0, _asyncToGenerator3.default)(function* () {
      let text;
      try {
        text = yield fs.readFile(file, `utf8`);
      } catch (err) {
        report.error(`There was a problem reading the file: ${file}`, err);
        return null;
      }

      if (text.indexOf(`graphql`) === -1) return null;
      const hash = crypto.createHash(`md5`).update(file).update(text).digest(`hex`);

      try {
        let astDefinitions = cache[hash] || (cache[hash] = yield findGraphQLTags(file, text));

        return astDefinitions.length ? {
          kind: `Document`,
          definitions: astDefinitions
        } : null;
      } catch (err) {
        report.error(`There was a problem parsing the GraphQL query in file: ${file}`, err);
        return null;
      }
    })();
  }

  parseFiles(files) {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      const documents = new Map();

      return Promise.all(files.map(function (file) {
        return _this.parseFile(file).then(function (doc) {
          if (!doc) return;
          documents.set(file, doc);
        });
      })).then(function () {
        return documents;
      });
    })();
  }
}
exports.default = FileParser;
//# sourceMappingURL=file-parser.js.map