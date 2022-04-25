import { API } from 'lambda-api';
import { LambdaServerConfig } from "./types";
declare const runServer: (lambdaApiApplication: API, config?: LambdaServerConfig) => void;
export default runServer;
