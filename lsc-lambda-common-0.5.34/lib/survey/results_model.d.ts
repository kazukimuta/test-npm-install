import { SurveyConfig, SurveyConfigModel, MemberConfig, MemberConfigModel } from "./config_model";
import { DateTime } from "luxon";
export declare type SurveyResultLine = {
    itemKey: string;
    surveyId: string;
    sortKey: string;
    userSearchKey: string;
    partitionKey: string;
    updatedAt: number;
    createdAt: number;
    value: string;
    userId: string;
    indexId?: string;
    indexSearchKey?: string;
    check?: string;
};
export declare type MemberResultLine = {
    itemKey: string;
    surveyId: string;
    sortKey: string;
    userSearchKey: string;
    partitionKey: string;
    updatedAt: number;
    createdAt: number;
    value: string;
    userId: string;
    indexId?: string;
    indexSearchKey?: string;
    check?: string;
};
export declare type ResultsFilter = {
    logic: 'and' | 'or';
    fields: {
        itemKey: string;
        value: string;
    }[];
};
export declare class SurveyResult {
    readonly answers: SurveyResultLine[];
    readonly configModel: SurveyConfigModel;
    constructor(answerLines: SurveyResultLine[], config: SurveyConfig);
    matches(filter: ResultsFilter): boolean;
    getStatusOfResultLine(): string | null | undefined;
    getAnswersByItemId(itemKey: string): SurveyResultLine[];
    private hasMatchingField;
    getValue(itemId: string): string | string[] | undefined;
    getLinedAnswers(): any[];
    get uid(): string;
    get resultId(): string;
    static buildFromLines(answers: SurveyResultLine[], config: SurveyConfig): SurveyResult[];
}
export declare class ReservationLineModel {
    private line;
    private readonly _categoryId;
    private readonly _date;
    private readonly _time;
    constructor(line: any);
    get hasValidDate(): boolean | "";
    get hasValidCategory(): boolean;
    get rawLine(): any;
    get categoryIdPrefix(): string;
    get itemKey(): string;
    get categoryId(): string;
    get datetime(): DateTime;
    get dateStr(): string;
    get timestamp(): number;
}
export declare class MemberResult {
    readonly answers: MemberResultLine[];
    readonly configModel: MemberConfigModel;
    constructor(answerLines: MemberResultLine[], config: MemberConfig);
    matches(filter: ResultsFilter): boolean;
    getStatusOfResultLine(): string | null | undefined;
    getAnswersByItemId(itemKey: string): MemberResultLine[];
    private hasMatchingField;
    getValue(itemId: string): string | string[] | undefined;
    getLinedAnswers(): any[];
    get uid(): string;
    get resultId(): string;
    static buildFromLines(answers: MemberResultLine[], config: MemberConfig): MemberResult[];
}
