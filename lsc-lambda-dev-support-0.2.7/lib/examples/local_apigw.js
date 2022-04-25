"use strict";
/*
 * Copyright 2020 LINE Fukuoka Corporation
 *
 * LINE Corporation licenses this file to you under the Apache License,
 * version 2.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importStar(require("../index"));
const lambda_api_1 = __importDefault(require("lambda-api"));
const controller = (api) => {
    // GET http://localhost:3002/myapi/db
    api.get('/', ((req, res) => {
        console.log(req.query);
        res.status(200).header('requestId', req.requestContext.requestId).json(['data1', 'data2']);
    }));
    // POST http://localhost:3002/myapi/db/echo
    api.post('/echo', (((req, res) => {
        res.status(200).header('requestId', req.requestContext.requestId).json(req.body);
    })));
};
const api = lambda_api_1.default();
api.register(controller, { prefix: '/db' });
index_1.loadLambdaEnvironment('lsc-dev-platform-dynamic-AdminFunction', 'lsc-dev').then((env) => {
    index_1.default(api, {
        port: 3002,
        rootPath: '/myapi',
        debug: true,
    });
});
//# sourceMappingURL=local_apigw.js.map