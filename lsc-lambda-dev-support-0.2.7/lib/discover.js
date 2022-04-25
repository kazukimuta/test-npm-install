"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadLambdaEnvironment = void 0;
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
const aws_sdk_1 = require("aws-sdk");
const config_1 = require("./config");
exports.loadLambdaEnvironment = async (lambdaName, profile) => {
    const client = new aws_sdk_1.Lambda(config_1.getAwsCredentials(profile));
    const func = await fundFunction(lambdaName, client);
    return (func.Environment || {}).Variables || {};
};
const fundFunction = async (lambdaName, client) => {
    return await client.getFunctionConfiguration({
        FunctionName: lambdaName,
    }).promise();
};
//# sourceMappingURL=discover.js.map