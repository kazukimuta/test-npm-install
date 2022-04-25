import { APIGatewayProxyEventBase, Context } from "aws-lambda";
import * as Koa from 'koa';
export declare type ConfigMap = {
    [key: string]: any;
};
export declare type HeadersMap = {
    [key: string]: string;
};
export declare type RawRequest = Koa.Context;
export declare type LambdaServerConfig = {
    port?: number;
    rootPath?: string;
    debug?: boolean;
    inputEventConverter?: (apiGatewayEvent: LambdaApiGatewayEvent, ctx: RawRequest) => Promise<LambdaApiGatewayEvent>;
};
export declare type LambdaApiGatewayEvent = APIGatewayProxyEventBase<{}>;
export declare type LambdaContext = Context;
export declare type ApiGatewayEvent = {
    resource: string;
    path: string;
    httpMethod: string;
    requestContext: any;
    headers: HeadersMap;
    multiValueHeaders: {
        [key: string]: string[];
    };
    body?: string;
};
