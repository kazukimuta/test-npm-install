import { Credentials } from "aws-sdk";
import { CredentialsOptions } from "aws-sdk/lib/credentials";
export declare type AwsCredentials = {
    credentials?: Credentials | CredentialsOptions | null;
    region?: string;
};
