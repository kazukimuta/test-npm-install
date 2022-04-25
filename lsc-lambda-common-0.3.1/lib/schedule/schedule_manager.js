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
exports.ScheduleManager = void 0;
const luxon_1 = require("luxon");
const recurring_calculations_1 = require("./recurring_calculations");
class ScheduleManager {
    constructor(config) {
        this.outputFormat = 'yyyyLLdd';
        this.config = config;
        if (!config.period) {
            throw "required parameter 'period' is not specified";
        }
        this.exclude = new recurring_calculations_1.DaysFilter({ excludeDates: [], excludeDaysOfWeek: [] });
    }
    setExcludeDateConfig(config) {
        this.exclude = new recurring_calculations_1.DaysFilter(config);
    }
    setActivePeriodFrame(from, till) {
        this.period = new recurring_calculations_1.DateFrame(from, till);
    }
    setCustomOutputFormat(format) {
        this.outputFormat = format;
    }
    formatResult(date) {
        if (!date) {
            return null;
        }
        return date.toFormat(this.outputFormat);
    }
    isDateSatisfies(date) {
        const base = recurring_calculations_1.getDateTime(date).endOf('day');
        if (this.period && !this.period.isInside(base)) {
            return false;
        }
        if (this.isExcluded(base)) {
            return false;
        }
        return this.checkDate(base);
    }
    findNextDate(date) {
        const base = luxon_1.DateTime.fromISO(date).endOf('day');
        return this.formatResult(this.search(base));
    }
    _findSomeDates(startFrom, maxNumber = 50, maxPeriodDays = 356) {
        let start = recurring_calculations_1.getDateTime(startFrom);
        const result = [];
        let counter = 0;
        let outOrFrame = false;
        do {
            counter++;
            if (this.isDateSatisfies(start)) {
                result.push(start.toFormat(this.outputFormat));
            }
            start = start.plus({ day: 1 });
            outOrFrame = this.period ? this.period.isAfter(start) : false;
        } while (counter <= maxPeriodDays && result.length < maxNumber && !outOrFrame);
        return result;
    }
    findSomeDates(maxNumber = 50, maxPeriodDays = 356) {
        let start = this.period ? this.period.from : luxon_1.DateTime.local();
        return this._findSomeDates(start, maxNumber, maxPeriodDays);
    }
    findSomeFutureDates(startFrom, numberOfCandidates = 10) {
        let startFromNext = luxon_1.DateTime.fromISO(startFrom).endOf('day');
        return this._findSomeDates(startFromNext, numberOfCandidates, 356);
    }
    findNearestFutureDateTime(time, mNow) {
        let now;
        if (!mNow) {
            now = luxon_1.DateTime.local();
        }
        else {
            now = luxon_1.DateTime.fromISO(mNow);
        }
        if (!this.period) {
            throw 'Can not perform period-based calculation, because the period is not specified';
        }
        if (this.checkAllConditions(now)) {
            const targetTime = luxon_1.DateTime.fromISO(time);
            const border = now.set({ hour: targetTime.hour, minute: targetTime.minute, second: 0 });
            if (now <= border) {
                return this.formatResult(border);
            }
        }
        const searchAfter = now.endOf("day");
        let currentDate = this.period.from.minus({ day: 1 }).endOf('day');
        // while (searchAfter > currentDate) {
        //   const next = this.search(currentDate);
        //   if (!next) return null;
        //   currentDate = next;
        // }
        do {
            const next = this.search(currentDate);
            if (!next)
                return null;
            currentDate = next;
        } while (searchAfter > currentDate);
        if (!currentDate)
            return null;
        return this.formatResult(currentDate);
    }
    findNextDateBasedOnPeriod(searchAfterThisDate) {
        if (!this.period) {
            throw 'Can not perform period-based calculation, because the period is not specified';
        }
        if (!searchAfterThisDate) {
            searchAfterThisDate = luxon_1.DateTime.local().toISO();
        }
        const searchAfter = luxon_1.DateTime.fromISO(searchAfterThisDate).endOf("day");
        let currentDate = this.period.from;
        while (searchAfter > currentDate) {
            const next = this.search(currentDate);
            if (!next)
                return null;
            currentDate = next;
        }
        return this.formatResult(currentDate);
    }
    search(startFrom) {
        let currentBase = startFrom;
        if (this.period && this.period.isAfter(currentBase)) {
            return null;
        }
        let attempts = 0;
        while (attempts++ < 12) {
            if (this.period && this.period.isBefore(currentBase)) {
                currentBase = this.period.from;
                if (!this.checkDate(currentBase)) {
                    currentBase = this.getNextDate(currentBase);
                }
            }
            else {
                currentBase = this.getNextDate(currentBase);
            }
            if (!currentBase) {
                return null;
            }
            if (this.period && this.period.isAfter(currentBase)) {
                return null;
            }
            const isExcluded = this.isExcluded(currentBase);
            if (!isExcluded) {
                return currentBase;
            }
        }
        return null;
    }
    createCustomCalculator() {
        if (!this.config.custom) {
            throw "Wrong configuration: 'custom' is not defined";
        }
        const { type, skip, dates, numberedDayOfWeek } = this.config.custom;
        const customType = type;
        if (!customType) {
            throw "Wrong configuration: custom.type is not defined";
        }
        switch (customType) {
            case "skip":
                if (!skip) {
                    throw "Wrong configuration: custom.type.skip is not defined";
                }
                if (!this.period) {
                    throw "Period must be specified for 'skip' custom scheduler";
                }
                const dayToKeep = this.period.from;
                return new recurring_calculations_1.SkipPeriodCalc({
                    period: skip.period,
                    length: skip.length,
                    startDate: dayToKeep,
                });
            case "numberedDayOfWeek":
                if (!numberedDayOfWeek) {
                    throw "Wrong configuration: custom.numberedDayOfWeek is not defined";
                }
                return new recurring_calculations_1.NumberedDayOfWeekCalc({
                    days: numberedDayOfWeek,
                });
            case "dates":
                if (!dates) {
                    throw "Wrong configuration: custom.dates is not defined";
                }
                return new recurring_calculations_1.SelectedDatesCalc(dates);
            default:
                throw "Unknown custom schedule type " + customType;
        }
    }
    getCalculator(base) {
        const periodType = this.config.period.toLowerCase();
        let calculator;
        switch (periodType) {
            case "custom":
                calculator = this.createCustomCalculator();
                break;
            case "lastday":
                calculator = new recurring_calculations_1.EndOfMonthCalc();
                break;
            case "monthly":
                calculator = new recurring_calculations_1.MonthlyCalc(this.config.daysOfMonth);
                break;
            case "weekly":
                calculator = new recurring_calculations_1.WeeklyCalc(this.config.daysOfWeek);
                break;
            case "daily":
                calculator = new recurring_calculations_1.DailyCalc();
                break;
            default:
                throw "Unknown recurring period: " + periodType;
        }
        return calculator;
    }
    checkAllConditions(target) {
        const check = this.checkDate(target);
        if (!check) {
            return false;
        }
        if (this.period && this.period.isAfter(target)) {
            return false;
        }
        const isExcluded = this.isExcluded(target);
        if (isExcluded) {
            return false;
        }
        return true;
    }
    checkDate(target) {
        const calculator = this.getCalculator(target);
        return calculator.isDateSatisfied(target);
    }
    getNextDate(base) {
        const calculator = this.getCalculator(base);
        const nextDayString = calculator.getNextDay(base);
        if (!nextDayString)
            return null;
        return luxon_1.DateTime.fromISO(nextDayString);
    }
    isExcluded(date) {
        return this.exclude.matches(date);
    }
    isInPeriod(date) {
        if (this.period) {
            return this.period.isInside(date);
        }
        return true;
    }
}
exports.ScheduleManager = ScheduleManager;
