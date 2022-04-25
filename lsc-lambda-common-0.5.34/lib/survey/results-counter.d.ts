import { AwsCredentials } from "../types";
export default class ResultsCounter {
    private databaseName;
    private credentials;
    private _maxExecutionLengthMs;
    constructor(databaseName: string, credentials: AwsCredentials);
    set maxExecutionLengthMs(ms: number);
    countForSurvey(surveyId: string, lastEvaluatedKey?: any): Promise<{
        uniqueKeys: number;
        timeUsedMs: number;
        itemsScanned: number;
        rruUsed: number;
        lastEvaluatedKey: any;
    }>;
}
