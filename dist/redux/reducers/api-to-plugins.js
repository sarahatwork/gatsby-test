"use strict";

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = (state = [], action) => {
  switch (action.type) {
    case `SET_SITE_API_TO_PLUGINS`:
      return (0, _extends3.default)({}, action.payload);
    default:
      return state;
  }
};
//# sourceMappingURL=api-to-plugins.js.map