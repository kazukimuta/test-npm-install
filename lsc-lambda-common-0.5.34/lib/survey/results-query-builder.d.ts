import { ArgumentMappingType, DatesFilterModel, ExpressionType, FieldsFilterModel, ParameterMappingType } from "./results-query-helpers";
export declare type ResultsQueryModel = {
    keyExpression: string;
    filterExpression?: string;
    argumentsMapping: ArgumentMappingType;
    valuesMapping: ParameterMappingType;
    indexName?: string;
    reverseScan?: boolean;
    lastEvaluatedKey?: any;
    sortKeyName?: string;
    paginate?: boolean;
    postDownloadFilter?: ResultsQueryModelPostFilterCallback;
    requiredAttributes?: string[];
};
export declare type ResultsQueryModelPostFilterCallback = (item: any) => boolean;
export declare type CategoryPredicate = (categoryId: string) => boolean;
export declare class ResultsQueryBuilder {
    readonly surveyId: string;
    private fields;
    private dates;
    readonly lastEvaluatedKey?: any;
    private metadataOnlyMode;
    private _categoryPredicate;
    constructor(surveyId: string, fields: FieldsFilterModel, dates: DatesFilterModel, lastEvaluatedKey?: any);
    private hasSomethingForFieldSearch;
    set metadataOnly(flag: boolean);
    set categoryPredicate(predicate: CategoryPredicate);
    willUseSequenceSearch(): boolean;
    canUseParallelSearch(): boolean;
    willUseFieldSearch(): boolean;
    updateAtPrioritySearch(lastEvaluatedKey?: any, reverse?: boolean): ResultsQueryModel;
    private createCheckIndexReqeuest;
    createAndExpressionFor(...keysToBuild: string[]): ExpressionType;
    createResultsMetaAttributesRequest(rowsFilterItemKey: string, lastEvaluatedKey?: any): ResultsQueryModel;
    createFilterExpressionOnlyRequest(lastEvaluatedKey?: any): ResultsQueryModel;
    /**
     *
     * @param key itemKey of type=reservation field
     * @param categoriesToMatch
     */
    createReservationDateBasedRequest: (key: string, categoriesToMatch?: string[] | undefined) => ResultsQueryModel;
    createParallelSearchQueryModel(key: string, value: string): ResultsQueryModel;
    checkSearchParallelQueryModel(): {
        values: string[];
        factory: (val: string) => ResultsQueryModel;
    };
    checkSearchSimpleQueryModel(): ResultsQueryModel;
}
