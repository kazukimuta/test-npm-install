import { Lambda } from 'aws-sdk';
export declare const loadLambdaEnvironment: (lambdaName: string, profile?: string | undefined) => Promise<Lambda.EnvironmentVariables>;
