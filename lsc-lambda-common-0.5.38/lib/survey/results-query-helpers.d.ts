import { MergedRecordType } from "./results-parallel-loader";
export declare type ArgumentMappingType = {
    [key: string]: string | undefined;
};
export declare type ParameterMappingType = {
    [key: string]: any;
};
export declare type KeyValueType = string | number | boolean | null;
export declare type FieldsFilterValueType = string[] | ({
    [key: string]: any;
} & {
    values: string[];
}) | string;
export declare type FieldsFilter = {
    [key: string]: FieldsFilterValueType;
};
export declare type DatesFilter = {
    [key: string]: {
        from: string | null;
        to: string | null;
    };
};
export declare const NULL_VALUE_STR = "---===!NULL!===---";
export declare type ResultSearchRequest = {
    surveyId: string;
    filterCommon: FieldsFilter;
    filterDate: DatesFilter;
    lastEvaluatedKey?: any;
    sortBy?: string[];
    sortDesc?: boolean[];
    options?: {
        maxReturnedCount?: number;
        maxSearchTime?: number;
    };
};
export declare type ResultsMetaSearchResponse = {
    results_meta: any[];
    preLoadedItems: any[];
    lastEvaluatedKey?: any;
    rruUsed: number;
    timeUsedMs: number;
    returnedCount: number;
    totalCount: number;
};
export declare type ResultsFullSearchResponse = {
    items: any[];
    lastEvaluatedKey?: any;
    rruUsed: number;
    timeUsedMs: number;
    returnedCount: number;
    totalCount: number;
};
export declare type ExpressionType = {
    expressionString: string;
    argumentsMapping: ArgumentMappingType;
    valuesMapping: ParameterMappingType;
};
export declare class DatesFilterModel {
    private filter;
    constructor(filter: DatesFilter);
    getValidFilter(): DatesFilter;
    getBetweenInUnix(key: string): {
        from: number;
        to: number;
    } | null;
    hasValues(key?: string): boolean;
    getKeys(): string[];
    hasReservation(): boolean;
    getReservation(): {
        from: number;
        to: number;
    } | null;
}
declare type NormalizedFieldsFilter = {
    [key: string]: {
        values: string[];
        options: {
            [key: string]: string;
        };
    };
};
export declare class FieldsFilterModel {
    private rawFilter;
    private validFilter;
    constructor(rawFilter: FieldsFilter);
    private hasValue;
    adjustKeysTo(...keys: string[]): void;
    getValidFilter(filter: FieldsFilter): NormalizedFieldsFilter;
    isEmpty(): boolean;
    getValues(key: string): string[];
    getOptionValue(key: string, optionName: string): string | null;
    hasValues(key: string): boolean;
    getValuesForCategoryFilter(key: string): any;
    getKeys(): string[];
    ignore(key?: string): FieldsFilterModel;
}
export declare const fixReservationDaysInterval: ({ from, to }: {
    from?: string | undefined;
    to?: string | undefined;
}) => {
    from: number;
    to: number;
};
export declare class RequestExpressionsBuilder {
    private join;
    static get emptyExpression(): {
        expressionString: string;
        argumentsMapping: {};
        valuesMapping: {};
    };
    joinOr(...expressions: ExpressionType[]): ExpressionType;
    joinAnd(...expressions: ExpressionType[]): ExpressionType;
    makeOr(name: string, values?: KeyValueType[], mode?: string): ExpressionType;
    makeOrEqual(name: string, values?: KeyValueType[]): ExpressionType;
    makeWithLogic(name: string, index: number, value?: KeyValueType, mode?: string): {
        expressionString: string;
        argumentsMapping: {
            [x: string]: string;
        };
        valuesMapping: {
            ":null": null;
        };
    } | {
        expressionString: any;
        argumentsMapping: {
            [x: string]: string;
        };
        valuesMapping: {
            [x: string]: string | number | boolean;
            ":null"?: undefined;
        };
    };
    makeEqual(name: string, index: number, value?: KeyValueType): ExpressionType;
    makeInterval(name: string, { from, to }: {
        from?: KeyValueType;
        to?: KeyValueType;
    }): ExpressionType;
}
export declare class ItemsMergeHelper {
    constructor();
    groupAndMerge(items: Required<{
        partitionKey: string;
    }>[]): Required<{
        partitionKey: string;
        fields: any[];
    }>[];
    private mergeRecords;
}
export declare class MergedResultsFilter {
    private fields;
    private dates;
    private reservationKey?;
    private allowedCategoriesIds;
    private _categoriesPredicate;
    constructor(fields: FieldsFilterModel, dates: DatesFilterModel, reservationKey?: string | undefined);
    set categoriesPredicate(p: (id: string) => boolean);
    setAllowedCategories(categoryIds?: string[]): void;
    buildFilterPredicate(): (item: MergedRecordType) => boolean;
    doFiltering(items: MergedRecordType[]): Required<{
        partitionKey: string;
        fields: any[];
    }>[];
}
export {};
