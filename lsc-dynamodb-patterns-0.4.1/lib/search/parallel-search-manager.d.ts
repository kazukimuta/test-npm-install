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
};
export declare type SearchCallbackResponse = string[];
export declare type TaskContext = {
    consumedCapacityUnits: number;
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
    constructor(filter: SearchFilter);
    private mergeQueryResults;
    search(callback: SearchCallback, pollSize?: number): Promise<void>;
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
}
export {};
