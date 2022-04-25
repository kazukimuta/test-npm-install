import { AwsCredentials } from "../types";
export declare class BatchDownloader {
    private resultsTableName;
    private credentials;
    constructor(resultsTableName: string, credentials: AwsCredentials);
    download(partitionKeys: string[], pollSize?: number): Promise<{
        timeUsedMs: number;
        rruUsed: number;
        totalCount: number;
        items: Required<{
            partitionKey: string;
            fields: any[];
        }>[];
    }>;
}
