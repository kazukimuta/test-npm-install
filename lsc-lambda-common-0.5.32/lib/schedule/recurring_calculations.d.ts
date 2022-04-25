import { DateTime } from 'luxon';
export declare type DateValue = string | DateTime;
export interface NextDayCalculator {
    getNextDay(base: DateValue): string | null;
    isDateSatisfied(date: DateValue): boolean;
}
export declare const getDateTime: (val: DateValue) => DateTime;
export declare class DailyCalc implements NextDayCalculator {
    getNextDay(base: DateValue): string;
    isDateSatisfied(date: DateValue): boolean;
}
export declare type WeeklyCalcParams = {
    daysOfWeek: number[];
};
export declare class WeeklyCalc implements NextDayCalculator {
    readonly daysOfWeek: number[];
    constructor(params: number[]);
    getNextDay(base: DateValue): string;
    isDateSatisfied(date: DateValue): boolean;
}
export declare type MonthlyCalcParams = {
    dates: [];
};
export declare class MonthlyCalc implements NextDayCalculator {
    readonly days: number[];
    constructor(dates: number[]);
    getNextDay(base: DateValue): string | null;
    isDateSatisfied(date: DateValue): boolean;
}
export declare class EndOfMonthCalc implements NextDayCalculator {
    getNextDay(base: DateValue): string;
    isDateSatisfied(date: DateValue): boolean;
}
export declare type SkipPeriodCalcParams = {
    period: string;
    length: number;
    startDate: DateValue;
    dayToKeep?: number;
};
export declare class SkipPeriodCalc implements NextDayCalculator {
    private params;
    constructor(params: SkipPeriodCalcParams);
    getNextDay(base: DateValue): string | null;
    isDateSatisfied(date: DateValue): boolean;
}
export declare class SelectedDatesCalc implements NextDayCalculator {
    readonly dates: DateTime[];
    constructor(dates: string[]);
    getNextDay(base: DateValue): string | null;
    isDateSatisfied(date: DateValue): boolean;
}
export declare type NumberedDayOfWeekCalcParams = {
    days: {
        dayOfWeek: number;
        number: number;
    }[];
};
export declare class NumberedDayOfWeekCalc implements NextDayCalculator {
    private params;
    constructor(params: NumberedDayOfWeekCalcParams);
    private static findThDateInMonth;
    getNextDay(base: DateValue): string | null;
    isDateSatisfied(date: DateValue): boolean;
}
export declare type DaysFilterParams = {
    excludeDates: string[];
    excludeDaysOfWeek: number[];
};
export declare class DaysFilter {
    readonly dates: DateTime[];
    readonly daysOfWeek: number[];
    constructor(params: DaysFilterParams);
    matches(date: DateValue): boolean;
}
export declare class DateFrame {
    readonly from: DateTime;
    readonly till: DateTime;
    constructor(dateFrom: DateValue, dateTill: DateValue);
    isInside(dateParam: DateValue): boolean;
    isBefore(dateParam: DateValue): boolean;
    isAfter(dateParam: DateValue): boolean;
}
