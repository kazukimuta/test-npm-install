import * as AWS from 'aws-sdk';
export declare type SimpleConfigMap = {
    [key: string]: string;
};
export declare const loadFromFile: (filename?: string) => SimpleConfigMap;
export declare const getAwsCredentials: (profileName?: string | undefined) => {
    credentials: AWS.SharedIniFileCredentials;
    region: string;
} | undefined;
