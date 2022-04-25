import { DateFrame, DateValue, DaysFilter, DaysFilterParams } from "./recurring_calculations";
export declare type RecurringConfiguration = {
    period: string;
    daysOfWeek: number[];
    daysOfMonth: number[];
    custom?: {
        type: string;
        skip?: {
            period: string;
            length: number;
        };
        numberedDayOfWeek?: {
            dayOfWeek: number;
            number: number;
        }[];
        dates?: string[];
    };
};
export declare class ScheduleManager {
    period: DateFrame | null;
    exclude: DaysFilter;
    config: RecurringConfiguration;
    outputFormat: string;
    constructor(config: RecurringConfiguration);
    setExcludeDateConfig(config: DaysFilterParams): void;
    setActivePeriodFrame(from: string, till: string): void;
    setCustomOutputFormat(format: string): void;
    private formatResult;
    isDateSatisfies(date: DateValue): boolean;
    findNextDate(date: string): string | null;
    private _findSomeDates;
    findSomeDates(maxNumber?: number, maxPeriodDays?: number): string[];
    findSomeFutureDates(startFrom: string, numberOfCandidates?: number): string[];
    findNearestFutureDateTime(time: string, mNow?: string): string | null;
    findNextDateBasedOnPeriod(searchAfterThisDate?: string): string | null;
    private search;
    private createCustomCalculator;
    private getCalculator;
    private checkAllConditions;
    private checkDate;
    private getNextDate;
    private isExcluded;
    private isInPeriod;
}
