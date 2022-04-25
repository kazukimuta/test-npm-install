import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as aws from 'aws-sdk';
export declare type TableIndex = {
    pkField: string;
    skField?: string;
};
export declare type TableConfiguration = {
    pkField: string;
    skField?: string;
    indexes?: {
        [key: string]: TableIndex;
    };
};
export declare type Key = {
    pk: string;
    sk?: string;
    index?: string;
};
export declare type Query = {
    index?: string;
    query: string;
    mapping: {
        [key: string]: any;
    };
    attributes?: string[];
    filter?: string;
    reverseSearch?: boolean;
};
declare type PageSettings = {
    limit?: number;
    lastEvaluatedKey?: any;
};
export declare type OnePageQuery = PageSettings & Query;
export declare type ScanFilter = {
    filter: string;
    index?: string;
    mapping: {
        [key: string]: any;
    };
};
export declare type OnePageScan = PageSettings & ScanFilter;
export declare type Stats = {
    totalOperationCapacity: number;
};
export declare type LocalAwsCredentials = {
    profile: string;
    region?: string;
};
export declare type ItemsRequestResultPage = {
    items: any[];
    lastEvaluatedKey: any;
};
export declare type AwsClientParameters = DocumentClient.DocumentClientOptions & aws.DynamoDB.Types.ClientConfiguration | LocalAwsCredentials | string;
export declare class Table {
    private readonly dbClient;
    private readonly tableName;
    private config;
    private awsCfg;
    private lastOperationStats;
    constructor(name: string, config: TableConfiguration | null, awsConfig?: AwsClientParameters);
    setPrimaryKey(hashKey: string, sortKey?: string): void;
    getDocumentClient(): DocumentClient;
    getConfiguration(): TableConfiguration;
    private ensureKey;
    private mapKey;
    private makeKey;
    getItem(key: Key): Promise<any>;
    putItem(item: any, key?: Key): Promise<void>;
    private updateOrDeleteFieldsInternal;
    update(item: any, key?: Key): Promise<any>;
    updateOrDeleteFields(fields: any, key?: Key): Promise<any>;
    resetStats(): void;
    getStats(): {
        totalOperationCapacity: number;
    };
    private saveStats;
    batchPut(items: any[]): Promise<any[]>;
    batchGet(keys: Key[]): Promise<any[]>;
    getAllItems(filter?: ScanFilter): Promise<any[]>;
    scanPage(filter?: OnePageScan): Promise<ItemsRequestResultPage>;
    queryItems(query: Query): Promise<any[]>;
    queryPage(query: OnePageQuery): Promise<ItemsRequestResultPage>;
    deleteItems(keys: Key[]): Promise<void>;
    deleteItem(key: Key): Promise<void>;
    deleteAll(): Promise<void>;
    testConnection(): Promise<any>;
    private paginateQuery;
    private paginateScan;
}
export declare const paginateQuery: (client: DocumentClient, request: DocumentClient.QueryInput) => Promise<any>;
export declare const paginateScan: (client: DocumentClient, request: DocumentClient.ScanInput) => Promise<any>;
export {};
