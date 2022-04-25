"use strict";
/*
 * Copyright 2020 LINE Fukuoka Corporation
 *
 * LINE Corporation licenses this file to you under the Apache License,
 * version 2.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateFrame = exports.DaysFilter = exports.NumberedDayOfWeekCalc = exports.SelectedDatesCalc = exports.SkipPeriodCalc = exports.EndOfMonthCalc = exports.MonthlyCalc = exports.WeeklyCalc = exports.DailyCalc = exports.getDateTime = void 0;
const luxon_1 = require("luxon");
const _ = require("lodash");
const getDateTime = (val) => {
    if (luxon_1.DateTime.isDateTime(val))
        return val;
    const parsed = luxon_1.DateTime.fromISO(val);
    if (parsed.isValid)
        return parsed;
    throw 'Unparseable base date value ' + val;
};
exports.getDateTime = getDateTime;
const formatResult = (val) => {
    return exports.getDateTime(val).toFormat('yyyyLLdd');
};
class DailyCalc {
    getNextDay(base) {
        const result = exports.getDateTime(base).plus(luxon_1.Duration.fromObject({ days: 1 }));
        return formatResult(result);
    }
    isDateSatisfied(date) {
        return true;
    }
}
exports.DailyCalc = DailyCalc;
class WeeklyCalc {
    constructor(params) {
        if (params.length === 0) {
            throw "Can not perform weekly schedule calculation without at least 1 day specified";
        }
        this.daysOfWeek = params;
    }
    getNextDay(base) {
        const baseDate = exports.getDateTime(base);
        const baseDayOfWeek = baseDate.weekday;
        let nextWeek = true;
        let nextWeekDay = Math.min(...this.daysOfWeek);
        const nextDays = this.daysOfWeek.filter((v) => v > baseDayOfWeek);
        if (nextDays.length > 0) {
            nextWeek = false;
            nextWeekDay = Math.min(...nextDays);
        }
        let result = baseDate;
        if (nextWeek) {
            result = result.plus({ week: 1 });
        }
        result = result.set({ weekday: nextWeekDay });
        return formatResult(result);
    }
    isDateSatisfied(date) {
        const dateVal = exports.getDateTime(date);
        return this.daysOfWeek.includes(dateVal.weekday);
    }
}
exports.WeeklyCalc = WeeklyCalc;
class MonthlyCalc {
    constructor(dates) {
        if (dates.length === 0) {
            throw "Can not perform monthly schedule calculation without at least 1 date specified";
        }
        this.days = dates;
    }
    getNextDay(base) {
        const baseDate = exports.getDateTime(base);
        const currentDay = baseDate.day;
        let nextDays = this.days.filter((v) => v > currentDay).filter((v) => v <= baseDate.daysInMonth);
        let found = Math.min(...nextDays);
        let result;
        if (found === Infinity) {
            for (let i = 1; i < 6; i++) {
                let nextBase = baseDate.plus({ month: i }).set({ day: 1 });
                const dayInNextMonth = Math.min(...this.days.filter((v) => v <= nextBase.daysInMonth));
                if (dayInNextMonth !== Infinity) {
                    result = nextBase.set({ day: dayInNextMonth });
                }
            }
        }
        else {
            result = baseDate.set({ day: found });
        }
        if (!result) {
            return null;
        }
        let nextMonth = false;
        let resultDay;
        if (nextDays.length > 0) {
            resultDay = Math.min(...nextDays);
        }
        else {
            resultDay = Math.min(...this.days);
            nextMonth = true;
        }
        let resultDate = baseDate.set({ day: resultDay });
        if (nextMonth) {
            resultDate = resultDate.plus({ month: 1 });
        }
        return formatResult(resultDate);
    }
    isDateSatisfied(date) {
        const dateVal = exports.getDateTime(date);
        return this.days.includes(dateVal.day);
    }
}
exports.MonthlyCalc = MonthlyCalc;
class EndOfMonthCalc {
    getNextDay(base) {
        const baseDate = exports.getDateTime(base);
        let nextEoM = baseDate.plus({ day: 1 }).endOf("month");
        return formatResult(nextEoM);
    }
    isDateSatisfied(date) {
        const dateVal = exports.getDateTime(date);
        return dateVal.day === dateVal.endOf('month').day;
    }
}
exports.EndOfMonthCalc = EndOfMonthCalc;
class SkipPeriodCalc {
    constructor(params) {
        this.params = params;
    }
    getNextDay(base) {
        const baseDate = exports.getDateTime(base);
        let next;
        const period = this.params.period.toLowerCase();
        if (period.startsWith('month')) {
            let search = true;
            let counter = 1;
            const dayToKeep = this.params.dayToKeep || baseDate.day;
            do {
                next = baseDate.plus({ month: (this.params.length + 1) * counter }).set({ day: dayToKeep });
                if (next.day === dayToKeep) {
                    search = false;
                }
            } while (search && ++counter <= 24);
            if (search) {
                return null;
            }
        }
        else {
            next = baseDate.plus({ [period]: this.params.length + 1 });
        }
        return formatResult(next);
    }
    isDateSatisfied(date) {
        const baseDate = exports.getDateTime(date);
        const startDate = exports.getDateTime(this.params.startDate);
        const period = this.params.period.toLowerCase();
        if (baseDate.hasSame(startDate, 'day')) {
            return true;
        }
        let next = startDate;
        if (period.startsWith('month')) {
            let found = false;
            let counter = 1;
            const dayToKeep = startDate.day;
            do {
                next = startDate.plus({ month: (this.params.length + 1) * counter }).set({ day: dayToKeep });
                found = next.hasSame(baseDate, 'day');
                counter++;
            } while (!found && (next < baseDate));
            return found;
        }
        else {
            let counter = 1;
            let found = false;
            do {
                next = startDate.plus({ [period]: (this.params.length + 1) * counter });
                found = next.hasSame(baseDate, 'day');
                counter++;
            } while (!found && (next < baseDate));
            return found;
        }
    }
}
exports.SkipPeriodCalc = SkipPeriodCalc;
class SelectedDatesCalc {
    constructor(dates) {
        this.dates = dates.map((v) => luxon_1.DateTime.fromISO(v));
    }
    getNextDay(base) {
        const baseDate = exports.getDateTime(base);
        const candidate = this.dates.filter((d) => d > baseDate.endOf('day')).sort()[0];
        return candidate ? formatResult(candidate) : null;
    }
    isDateSatisfied(date) {
        const dateVal = exports.getDateTime(date);
        return !!this.dates.find((d) => d.hasSame(dateVal, 'day'));
    }
}
exports.SelectedDatesCalc = SelectedDatesCalc;
class NumberedDayOfWeekCalc {
    constructor(params) {
        this.params = params;
    }
    static findThDateInMonth(baseDate, weekDay, ordinalNumber) {
        let current = baseDate.startOf('month');
        let counter = 0;
        while (current.month === baseDate.month) {
            if (current.weekday === weekDay) {
                counter++;
                if (counter === ordinalNumber) {
                    return current;
                }
            }
            current = current.plus({ days: 1 });
        }
        return null;
    }
    getNextDay(base) {
        const baseDate = exports.getDateTime(base);
        let monthOffset = 0;
        let candidate = null;
        while (!candidate && monthOffset <= 12) {
            candidate = this.params.days.map(({ dayOfWeek, number }) => {
                return NumberedDayOfWeekCalc.findThDateInMonth(baseDate.plus({ month: monthOffset }), dayOfWeek, number);
            }).filter((v) => !_.isNil(v)).filter((v) => v > baseDate.endOf('day')).sort()[0];
            monthOffset++;
        }
        if (!candidate) {
            return null;
        }
        return formatResult(candidate);
    }
    isDateSatisfied(date) {
        const dateVal = exports.getDateTime(date);
        const candidatesOfThisMonth = this.params.days.map((p) => {
            return NumberedDayOfWeekCalc.findThDateInMonth(dateVal, p.dayOfWeek, p.number);
        }).filter((v) => !_.isNil(v));
        return !!candidatesOfThisMonth.find((d) => d.hasSame(dateVal, 'day'));
    }
}
exports.NumberedDayOfWeekCalc = NumberedDayOfWeekCalc;
class DaysFilter {
    constructor(params) {
        this.daysOfWeek = params.excludeDaysOfWeek;
        this.dates = params.excludeDates.map(exports.getDateTime);
    }
    matches(date) {
        const dateVal = exports.getDateTime(date);
        if (this.daysOfWeek.length > 0) {
            if (this.daysOfWeek.includes(dateVal.weekday)) {
                return true;
            }
        }
        if (this.dates.length > 0) {
            if (this.dates.find((d) => d.hasSame(dateVal, 'day'))) {
                return true;
            }
        }
        return false;
    }
}
exports.DaysFilter = DaysFilter;
class DateFrame {
    constructor(dateFrom, dateTill) {
        this.from = exports.getDateTime(dateFrom).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        this.till = exports.getDateTime(dateTill).endOf("day");
    }
    isInside(dateParam) {
        const date = exports.getDateTime(dateParam);
        return date >= this.from && date <= this.till;
    }
    isBefore(dateParam) {
        const date = exports.getDateTime(dateParam);
        return date < this.from;
    }
    isAfter(dateParam) {
        const date = exports.getDateTime(dateParam);
        return date > this.till;
    }
}
exports.DateFrame = DateFrame;
