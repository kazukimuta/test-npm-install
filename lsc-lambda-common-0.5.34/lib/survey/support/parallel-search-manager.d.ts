export declare type SearchFilterItem = {
    key: string;
    values: string[];
};
export declare type SearchFilter = SearchFilterItem[];
declare type QueryResult = {
    filter: SearchFilterItem;
    queryMilliseconds: number;
    queryCapacityUnits: number;
    ids: string[];
    lastEvaluatedKey?: any;
    results_meta: any[];
    ignore: boolean;
};
export declare type SearchCallbackResponse = any[];
export declare type TaskContext = {
    consumedCapacityUnits: number;
    lastEvaluatedKey?: any;
};
export declare type SearchCallback = (key: string, value: string, stats: TaskContext) => Promise<SearchCallbackResponse>;
export declare type CollectCallback = (id: string, stats: TaskContext) => Promise<any[]>;
export declare class ParallelSearchManager {
    private filter;
    private _queryResults;
    private _searchMilliseconds;
    private collectResult;
    private _collectMilliseconds;
    private _collectionCapacityUnits;
    private searchTasksQueue;
    private searchResult;
    private resultsMeta;
    constructor(filter: SearchFilter);
    private mergeQueryResults;
    getResultsCount(): number;
    search(callback: SearchCallback, pollSize?: number): Promise<void>;
    getLastEvaluatedKeyOfKey(key: string): any;
    collect(callback: CollectCallback, pollSize?: number): Promise<void>;
    get queriesResults(): QueryResult[];
    get searchTimeMilliseconds(): number;
    get collectTimeMilliseconds(): number;
    get queriesCapacityUnits(): number;
    get collectionCapacityUnits(): number;
    get collectionResult(): {
        id: string;
        items: any[];
    }[];
    get searchResultIds(): string[];
    get searchResultMeta(): any[];
}
export {};
