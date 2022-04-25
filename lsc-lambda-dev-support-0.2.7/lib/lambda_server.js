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
const cors_1 = __importDefault(require("@koa/cors"));
const koa_1 = __importDefault(require("koa"));
const koa_body_1 = __importDefault(require("koa-body"));
const koa_logger_1 = __importDefault(require("koa-logger"));
const uuid_1 = require("uuid");
const luxon_1 = require("luxon");
const decodeBase64 = (base64str) => {
    return Buffer.from(base64str, 'base64').toString('utf8');
};
const runServer = (lambdaApiApplication, config = {}) => {
    const opts = Object.assign({ port: 3000, rootPath: '/', debug: false }, config);
    const server = new koa_1.default();
    server.use(koa_logger_1.default());
    server.use(cors_1.default({
        keepHeadersOnError: true,
        origin: (ctx => ctx.headers['origin'] || '*'),
        allowHeaders: '*',
        allowMethods: ['PUT', 'POST', 'GET', 'DELETE', 'OPTIONS', 'PATCH'],
    }));
    server.use(koa_body_1.default({ json: true, multipart: true }));
    server.use(async (context, next) => {
        await next();
        let apiGatewayEvent = ctxToEvent(context, opts);
        if (opts.inputEventConverter) {
            const newEvent = await opts.inputEventConverter(apiGatewayEvent, context);
            if (newEvent) {
                apiGatewayEvent = newEvent;
            }
        }
        const lambdaContext = {
            callbackWaitsForEmptyEventLoop: false,
            functionName: "my-function",
            functionVersion: "1",
            invokedFunctionArn: "arn:my-function",
            logStreamName: "log-stream",
            memoryLimitInMB: "128",
            done(error, result) {
            },
            fail(error) {
            },
            getRemainingTimeInMillis() {
                return 0;
            },
            succeed(message, object) {
            },
            awsRequestId: uuid_1.v4(),
            logGroupName: 'log-group'
        };
        if (opts.debug) {
            console.log('<-- API GW EVENT\n', JSON.stringify(apiGatewayEvent, null, 2));
        }
        const response = await lambdaApiApplication.run(apiGatewayEvent, lambdaContext);
        if (opts.debug) {
            console.log('--> API GW RESPONSE\n', JSON.stringify(response, null, 2));
        }
        context.status = response.statusCode || 500;
        const lambdaHeaders = response.multiValueHeaders || {};
        Object.entries(lambdaHeaders).forEach((pair) => {
            const headerMultiValue = pair[1];
            if (headerMultiValue && headerMultiValue[0]) {
                context.response.set(pair[0], headerMultiValue[0]);
            }
        });
        if (response.body && response.isBase64Encoded) {
            context.body = decodeBase64(response.body);
        }
        else {
            context.body = response.body;
        }
    });
    server.listen(opts.port, () => {
        console.log(`Running Lambda API on http://localhost:${opts.port}${opts.rootPath}`);
    });
};
const ctxToEvent = (ctx, opts) => {
    let headers = ctx.headers;
    let mvh = {};
    Object.entries(ctx.headers).forEach((e) => {
        mvh[e[0]] = [e[1]];
    });
    let body = ctx.request.body;
    if ((ctx.headers['content-type'] || 'application/json').indexOf('json') > -1) {
        body = JSON.stringify(body);
    }
    let pathAfterGW = ctx.path;
    if (opts.rootPath && opts.rootPath.length > 1) {
        pathAfterGW = ctx.path.substr(opts.rootPath.length);
        if (pathAfterGW.endsWith('/')) {
            pathAfterGW = pathAfterGW.substr(0, pathAfterGW.length - 1);
        }
        if (!pathAfterGW.startsWith('/')) {
            pathAfterGW = '/' + pathAfterGW;
        }
    }
    const query = ctx.query;
    return {
        multiValueHeaders: mvh,
        resource: pathAfterGW,
        path: pathAfterGW,
        httpMethod: ctx.method.toUpperCase(),
        isBase64Encoded: false,
        stageVariables: null,
        pathParameters: null,
        multiValueQueryStringParameters: null,
        queryStringParameters: query,
        requestContext: {
            stage: 'Prod',
            authorizer: {},
            accountId: '000000000000',
            apiId: 'local-api',
            httpMethod: ctx.method.toUpperCase(),
            protocol: ctx.protocol,
            resourceId: 'local-api',
            requestId: uuid_1.v4(),
            requestTimeEpoch: luxon_1.DateTime.local().toMillis(),
            identity: {
                sourceIp: ctx.ip,
                accessKey: 'xxxxxxxxx',
                accountId: '000000000000',
                apiKey: null,
                apiKeyId: null,
                caller: null,
                cognitoAuthenticationProvider: null,
                cognitoAuthenticationType: null,
                cognitoIdentityId: null,
                cognitoIdentityPoolId: null,
                principalOrgId: null,
                user: null,
                userAgent: ctx.headers['User-Agent'],
                userArn: null,
            },
            resourcePath: pathAfterGW,
            path: pathAfterGW,
        },
        headers,
        body
    };
};
exports.default = runServer;
//# sourceMappingURL=lambda_server.js.map