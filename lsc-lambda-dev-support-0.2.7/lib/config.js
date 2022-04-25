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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAwsCredentials = exports.loadFromFile = void 0;
const fs = __importStar(require("fs"));
const yaml = __importStar(require("yaml"));
const AWS = __importStar(require("aws-sdk"));
exports.loadFromFile = (filename = 'env.yaml') => {
    const yamlStr = fs.readFileSync(filename, { encoding: 'utf-8' });
    return yaml.parse(yamlStr);
};
const isAwsEnvironment = () => {
    // check whether it is SAM local-api Docker env
    if (process.env.AWS_SAM_LOCAL === 'true') {
        return false;
    }
    return !!process.env.AWS_LAMBDA_LOG_STREAM_NAME;
};
exports.getAwsCredentials = (profileName) => {
    if (isAwsEnvironment()) {
        return undefined;
    }
    if (profileName) {
        return {
            credentials: new AWS.SharedIniFileCredentials({
                profile: profileName
            }),
            region: process.env.AWS_REGION || 'ap-northeast-1',
        };
    }
    return {
        credentials: new AWS.Credentials({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
        }),
        region: process.env.AWS_REGION || 'ap-northeast-1'
    };
};
//# sourceMappingURL=config.js.map