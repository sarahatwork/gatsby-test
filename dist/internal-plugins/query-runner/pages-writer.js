"use strict";

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _jsChunkNames = require("../../utils/js-chunk-names");

var _path = require("../../utils/path");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const _ = require(`lodash`);
const fs = require(`fs-extra`);

const { store, emitter } = require(`../../redux/`);


const getLayoutById = layouts => id => layouts.find(l => l.id === id);

// Write out pages information.
const writePages = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* () {
    bootstrapFinished = true;
    let { program, pages, layouts } = store.getState();
    // Write out pages.json
    const pagesData = pages.reduce(function (mem, { path, matchPath, componentChunkName, layout, jsonName }) {
      const layoutOjb = getLayoutById(layouts)(layout);
      return [...mem, {
        componentChunkName,
        layout: layoutOjb ? layoutOjb.machineId : layout,
        layoutComponentChunkName: layoutOjb && layoutOjb.componentChunkName,
        jsonName,
        path,
        matchPath
      }];
    }, []);

    // Get list of components, layouts, and json files.
    let components = [];
    let json = [];
    let pageLayouts = [];

    pages.forEach(function (p) {
      components.push({
        componentChunkName: p.componentChunkName,
        component: p.component
      });
      if (p.layout) {
        let layout = getLayoutById(layouts)(p.layout);
        pageLayouts.push(layout);
        json.push({
          jsonName: layout.jsonName
        });
      }
      json.push({ path: p.path, jsonName: p.jsonName });
    });

    pageLayouts = _.uniq(pageLayouts);
    components = _.uniqBy(components, function (c) {
      return c.componentChunkName;
    });

    // Create file with sync requires of layouts/components/json files.
    let syncRequires = `// prefer default export if available
const preferDefault = m => m && m.default || m
\n\n`;
    syncRequires += `exports.layouts = {\n${pageLayouts.map(function (l) {
      return `  "${l.machineId}": preferDefault(require("${l.componentWrapperPath}"))`;
    }).join(`,\n`)}
}\n\n`;
    syncRequires += `exports.components = {\n${components.map(function (c) {
      return `  "${c.componentChunkName}": preferDefault(require("${(0, _path.joinPath)(c.component)}"))`;
    }).join(`,\n`)}
}\n\n`;
    syncRequires += `exports.json = {\n${json.map(function (j) {
      return `  "${j.jsonName}": require("${(0, _path.joinPath)(program.directory, `/.cache/json/`, j.jsonName)}")`;
    }).join(`,\n`)}
}`;

    // Create file with async requires of layouts/components/json files.
    let asyncRequires = `// prefer default export if available
const preferDefault = m => m && m.default || m
\n`;
    asyncRequires += `exports.components = {\n${components.map(function (c) {
      return `  "${c.componentChunkName}": require("gatsby-module-loader?name=${c.componentChunkName}!${(0, _path.joinPath)(c.component)}")`;
    }).join(`,\n`)}
}\n\n`;
    asyncRequires += `exports.json = {\n${json.map(function (j) {
      return `  "${j.jsonName}": require("gatsby-module-loader?name=${(0, _jsChunkNames.generatePathChunkName)(j.path)}!${(0, _path.joinPath)(program.directory, `/.cache/json/`, j.jsonName)}")`;
    }).join(`,\n`)}
}\n\n`;
    asyncRequires += `exports.layouts = {\n${pageLayouts.map(function (l) {
      return `  "${l.machineId}": require("gatsby-module-loader?name=${l.componentChunkName}!${l.componentWrapperPath}")`;
    }).join(`,\n`)}
}`;

    yield Promise.all([fs.writeFile((0, _path.joinPath)(program.directory, `.cache/pages.json`), JSON.stringify(pagesData, null, 4)), fs.writeFile(`${program.directory}/.cache/sync-requires.js`, syncRequires), fs.writeFile((0, _path.joinPath)(program.directory, `.cache/async-requires.js`), asyncRequires)]);

    return;
  });

  return function writePages() {
    return _ref.apply(this, arguments);
  };
})();

exports.writePages = writePages;

let bootstrapFinished = false;
let oldPages;
const debouncedWritePages = _.debounce(() => {
  // Don't write pages again until bootstrap has finished.
  if (bootstrapFinished && !_.isEqual(oldPages, store.getState().pages)) {
    writePages();
    oldPages = store.getState().pages;
  }
}, 500, { leading: true });
emitter.on(`CREATE_PAGE`, () => {
  // Ignore CREATE_PAGE until bootstrap is finished
  // as this is called many many times during bootstrap and
  // we can ignore them until CREATE_PAGE_END is called.
  //
  // After bootstrap, we need to listen for this as stateful page
  // creators e.g. the internal plugin "component-page-creator"
  // calls createPage directly so CREATE_PAGE_END won't get fired.
  if (bootstrapFinished) {
    debouncedWritePages();
  }
});

emitter.on(`CREATE_PAGE_END`, () => {
  debouncedWritePages();
});
emitter.on(`DELETE_PAGE`, () => {
  debouncedWritePages();
});
emitter.on(`DELETE_PAGE_BY_PATH`, () => {
  debouncedWritePages();
});
//# sourceMappingURL=pages-writer.js.map