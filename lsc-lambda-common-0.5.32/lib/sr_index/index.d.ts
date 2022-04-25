import { Credentials } from 'aws-sdk';
import { CredentialsOptions } from "aws-sdk/lib/credentials";
export declare type AwsConfiguration = {
    credentials?: Credentials | CredentialsOptions | null;
    region?: string;
};
export declare type SurveyResultsIndexConfig = {
    surveyId?: string;
    itemKey?: string;
    limit?: number;
    awsConfig?: AwsConfiguration;
};
export declare type ContinueKey = {
    value: string;
    lastExtractedId: string;
};
export declare class SurveyResultsIndex {
    private readonly table;
    private limit;
    private readonly itemKey?;
    private readonly surveyId?;
    private readonly awsCredentials?;
    constructor(table: string, config?: SurveyResultsIndexConfig);
    forIndex(surveyId: string, itemKey: string): SurveyResultsIndex;
    setLimit(limit: number): this;
    private getIndexDb;
    private indexName;
    update(resultId: string, newValue: string, oldValue?: string): Promise<void>;
    query(value: string, lastEvaluatedKey?: ContinueKey): Promise<{
        items: never[];
        lastEvaluatedKey?: undefined;
    } | {
        items: string[];
        lastEvaluatedKey: ContinueKey | undefined;
    }>;
    remove(resultId: string, value: string): Promise<void>;
}
