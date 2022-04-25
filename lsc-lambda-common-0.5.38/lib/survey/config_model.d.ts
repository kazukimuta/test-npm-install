declare type FieldType = {
    itemKey: string;
    type: string;
    title: string;
    isRequired: {
        value: boolean;
    };
    description?: string;
    isSearchable: {
        value: boolean;
    };
    isIndexable: {
        value: boolean;
    };
};
declare type ReservationCategory = {
    name: string;
    children: {
        name: string;
        id: string;
        calendarId?: string;
    }[];
};
export declare type ReservationFieldType = {
    isFixedLargeCategory: boolean;
    isFixedMediumCategory: boolean;
    isFixedSmallCategory: boolean;
    reservationCheckBox: boolean;
    reservationSupCheckBox: boolean;
    selectedLargeCategory?: ReservationCategory;
    selectedMediumCategory?: ReservationCategory;
    setLargeCategoryTitle?: string;
    setMediumCategoryTitle?: string;
    setSmallCategoryTitle?: string;
    type: 'reservation';
} & FieldType;
export declare type SurveyConfig = {
    surveyId: string;
    surveySchema: FieldType[];
    categoriesPermissions?: {
        [key: string]: string[];
    };
};
export declare type MemberConfig = {
    memberSurveyId: string;
    surveySchema: FieldType[];
};
export declare class SurveyConfigModel {
    private readonly config;
    private readonly schema;
    constructor(surveyConfig: SurveyConfig);
    getField(itemKey: string): FieldType | undefined;
    isMultiValue(itemId: string): boolean;
    isScalarValue(itemId: string): boolean;
    exists(itemId: string): boolean;
    getOrdinal(itemId: string): number;
    isIndexable(itemId: string): boolean;
    isSearcheable(itemId: string): boolean;
    getSchema(): FieldType[];
    getSurveyId(): string;
    getDefinitionOfType(type: string): FieldType[];
    hasReservation(): boolean;
    getReservationDefinition(): ReservationFieldType;
    getReservationFieldKey(): string | undefined;
    getAllKeys(): string[];
    getAllowedTeamsOfCategory(categoryId: string): string[];
    hasAccessLimitationsForSomeCategory(): boolean;
}
export declare class MemberConfigModel {
    private readonly config;
    private readonly schema;
    constructor(surveyConfig: MemberConfig);
    getField(itemKey: string): FieldType | undefined;
    isMultiValue(itemId: string): boolean;
    isScalarValue(itemId: string): boolean;
    exists(itemId: string): boolean;
    getOrdinal(itemId: string): number;
    isIndexable(itemId: string): boolean;
    isSearcheable(itemId: string): boolean;
    getSchema(): FieldType[];
    getSurveyId(): string;
}
export {};
