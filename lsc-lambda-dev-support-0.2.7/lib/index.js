"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runServer = void 0;
const lambda_server_1 = __importDefault(require("./lambda_server"));
exports.runServer = lambda_server_1.default;
exports.default = lambda_server_1.default;
__exportStar(require("./types"), exports);
__exportStar(require("./options"), exports);
var discover_1 = require("./discover");
Object.defineProperty(exports, "loadLambdaEnvironment", { enumerable: true, get: function () { return discover_1.loadLambdaEnvironment; } });
//# sourceMappingURL=index.js.map