import { AwsCredentials } from "../types";
import { Table } from 'lsc-dynamodb-patterns/lib/table';
import { SearchCallbackResponse, TaskContext } from "./support/parallel-search-manager";
export declare type MergedRecordType = Required<{
    partitionKey: string;
    fields: any[];
}>;
export declare type ResultsParallelLoaderSearchCallback = (key: string, value: any, dbClient: Table, stats: TaskContext) => Promise<SearchCallbackResponse>;
export declare type ResultsParallelLoaderStatus = {
    result: 'done' | 'too_many_results' | 'not_started' | 'started';
    resultsToDownload?: number;
};
export declare class ResultsParallelLoader {
    private searchFilter;
    private mergedRecords;
    private dbClient;
    private surveyId;
    private totalTime;
    private consumedCapacity;
    private _searchCallback;
    private _status;
    constructor(tableName: string, credentials: AwsCredentials);
    setSurveyId(surveyId: string): void;
    addFilter(key: string, value: string): void;
    private SURROGATE_FIELDS;
    private INDIVIDUAL_FIELDS;
    private COMMON_FIELDS_OMIT;
    private mergeRecords;
    set searchCallback(callback: ResultsParallelLoaderSearchCallback);
    handleParametersSearch(): Promise<void>;
    load(): Promise<void>;
    isDone(): boolean;
    getStatus(): ResultsParallelLoaderStatus;
    getTime(): number;
    getConsumedCapacity(): number;
    getMergedRecords(): Required<{
        partitionKey: string;
        fields: any[];
    }>[];
}
