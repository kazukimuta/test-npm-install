import { AwsCredentials } from "../types";
import { ResultsQueryModel } from "./results-query-builder";
export default class ResultsQueryExecutor {
    private tableName;
    private awsCredentials;
    private _usedTimeMs;
    private _usedCapacityUnits;
    private _items;
    private _lastEvaluatedKey;
    private _limit;
    private table;
    private attrs?;
    private _adjustPage;
    constructor(tableName: string, awsCredentials: AwsCredentials);
    set adjustPage(flag: boolean);
    set limit(limit: number);
    set attributesToFetch(attrs: string[]);
    private adjustEvaluatedPage;
    private performPageRequest;
    private _loadRawLines;
    loadRawLines(queryModel: ResultsQueryModel): Promise<void>;
    get items(): any[];
    get lastEvaluatedKey(): any;
    get usedTimeMs(): number;
    get usedCapacityUnits(): number;
}
