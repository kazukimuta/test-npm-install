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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readOptionsFromArgs = void 0;
const command_line_args_1 = __importDefault(require("command-line-args"));
exports.readOptionsFromArgs = () => {
    const options = command_line_args_1.default([
        { name: 'rootPath', type: String, defaultValue: '/' },
        { name: 'port', type: Number, defaultValue: 3000 },
        { name: 'debug', type: Boolean, defaultValue: false }
    ]);
    return {
        rootPath: options['rootPath'],
        port: options['port'],
        debug: options['debug']
    };
};
//# sourceMappingURL=options.js.map