import { AwsCredentials } from "../types";
import { DatesFilter, FieldsFilter, ResultSearchRequest, ResultsMetaSearchResponse } from "./results-query-helpers";
export declare type QuickSearchManagerDatabaseConfig = {
    surveyConfigTable: string;
    surveyResultsTable: string;
    credentials: AwsCredentials;
    recordsPageLimit?: number;
};
export declare type CategoriesLoader = (params: {
    tag1?: string;
    tag2?: string;
    tag3?: string;
    id?: string;
}) => Promise<string[]>;
export declare class QuickSearchManager {
    private config;
    private sortConfig;
    private fields;
    private dates;
    private categoriesLoader?;
    private metadataAttributes;
    private maxReturnedCount;
    private lastKey?;
    private surveyConfig;
    private surveyId;
    private queryBuilder;
    private preloadConfig;
    private accessRules;
    private collectionTimeLimit;
    constructor(config: QuickSearchManagerDatabaseConfig);
    setFromSearchRequest(request: ResultSearchRequest): void;
    setPreloadConfig(cfg: {
        full: boolean;
    }): void;
    setSurvey(surveyId: string, surveyConfig?: any): void;
    setCategoriesLoader(loader: CategoriesLoader): void;
    setFieldsFilter(commonFilter: FieldsFilter): void;
    setDatesFilter(datesFilter: DatesFilter): void;
    setSorting(propertyName: string, desc?: boolean): void;
    setMetadataAttributes(attributes: string[]): void;
    setMaxReturnedCount(count: number): void;
    setLastKey(partitionKey: any): void;
    setAccessRules(rules: {
        teams: string[];
    }): void;
    setCollectionTimeLimit(limitSeconds: number): void;
    prepare(): Promise<void>;
    private getSurveyConfig;
    private hasSomethingForFieldSearch;
    private canLimitOnUpdatedAt;
    private categoriesFilteringPredicate;
    private loadItems;
    private indexSearchFormResult;
    private indexSearch;
    /**
     * The idea is in finding the field with the highest probability of being presented among all answers in
     * SurveyResults. The type == 'guide' is not real field. Required field would be presented for sure.
     * @private
     */
    private getMetaRecordSearchKey;
    /**
     * Here we have to scan across all answers and apply FilterExpression. This is the most ineffective search type,
     * but unavoidable, when the filter is not by fields, but metadata like status or update/create date.
     * @private
     */
    private searchByResultsMetaAttributes;
    /**
     * In this case all filtering
     * @private
     */
    private fullDataPreload;
    searchAndGetResults(): Promise<ResultsMetaSearchResponse>;
}
