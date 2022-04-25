import { AwsConfiguration } from "./index";
export declare type SurveyConfig = {
    surveyId: string;
    surveySchema: {
        itemKey: string;
        type: string;
        title: string;
        isSearchable: {
            value: boolean;
        };
        isIndexable: {
            value: boolean;
        };
    }[];
};
export declare type MemberConfig = {
    memberSurveyId: string;
    surveySchema: {
        itemKey: string;
        type: string;
        title: string;
        isSearchable: {
            value: boolean;
        };
        isIndexable: {
            value: boolean;
        };
    }[];
};
export declare type SurveyResultLine = {
    itemKey: string;
    surveyId: string;
    sortKey: string;
    userSearchKey: string;
    partitionKey: string;
    updatedAt: number;
    createdAt: number;
    value: string;
    userId: string;
    indexId?: string;
    indexSearchKey?: string;
};
export declare type MemberResultLine = {
    itemKey: string;
    surveyId: string;
    sortKey: string;
    userSearchKey: string;
    partitionKey: string;
    updatedAt: number;
    createdAt: number;
    value: string;
    userId: string;
    indexId?: string;
    indexSearchKey?: string;
};
export declare type SurveyResultsHelperConfig = {
    resultsTable: string;
    gsiName?: string;
    awsConfig?: AwsConfiguration;
    resultsLimit?: number;
};
export declare type SurveyResultQueryResults = {
    items: SurveyResultLine;
    lastEvaluatedKey: object;
};
export declare class SurveyResultsHelper {
    readonly config: SurveyResultsHelperConfig;
    readonly surveyConfig: SurveyConfig;
    readonly surveyId: string;
    constructor(surveyConfig: SurveyConfig, config: SurveyResultsHelperConfig);
    private resultsClient;
    getIndexedKeys(): string[];
    findIndexedFields(items: SurveyResultLine[]): SurveyResultLine[];
    private makeIndexId;
    private makeSearchKey;
    setIndexValues(items: SurveyResultLine[]): void;
    queryResultsByField(itemKey: string, value: string, lastEvaluatedKey?: object): Promise<{
        items: SurveyResultLine[];
        lastEvaluatedKey: any;
    }>;
    private loadSingleResult;
}
export declare class MemberResultsHelper {
    readonly config: SurveyResultsHelperConfig;
    readonly surveyConfig: MemberConfig;
    readonly surveyId: string;
    constructor(surveyConfig: MemberConfig, config: SurveyResultsHelperConfig);
    private resultsClient;
    getIndexedKeys(): string[];
    findIndexedFields(items: MemberResultLine[]): MemberResultLine[];
    private makeIndexId;
    private makeSearchKey;
    setIndexValues(items: MemberResultLine[]): void;
    queryResultsByField(itemKey: string, value: string, lastEvaluatedKey?: object): Promise<{
        items: MemberResultLine[];
        lastEvaluatedKey: any;
    }>;
    private loadSingleResult;
}
