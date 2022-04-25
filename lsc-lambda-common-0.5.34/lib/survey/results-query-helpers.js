"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergedResultsFilter = exports.ItemsMergeHelper = exports.RequestExpressionsBuilder = exports.fixReservationDaysInterval = exports.FieldsFilterModel = exports.DatesFilterModel = exports.NULL_VALUE_STR = void 0;
const _ = require("lodash");
const luxon_1 = require("luxon");
const results_model_1 = require("./results_model");
exports.NULL_VALUE_STR = "---===!NULL!===---";
class DatesFilterModel {
    constructor(filter) {
        this.filter = filter;
    }
    getValidFilter() {
        const correctFilter = {};
        Object.keys(this.filter).forEach((key) => {
            if (!this.filter[key]) {
                return;
            }
            const params = this.filter[key];
            const correctParams = {};
            Object.entries((params))
                .filter(([x, val]) => !_.isEmpty(val))
                .forEach(([key, val]) => correctParams[key] = val);
            if (!_.isEmpty(correctParams)) {
                correctFilter[key] = correctParams;
            }
        });
        return correctFilter;
    }
    getBetweenInUnix(key) {
        const pair = this.getValidFilter()[key];
        if (!pair)
            return null;
        return {
            from: startDayToUnixSeconds(pair.from),
            to: endDayToUnixSeconds(pair.to)
        };
    }
    hasValues(key) {
        if (key) {
            return this.getBetweenInUnix(key) !== null;
        }
        else {
            return Object.keys(this.getValidFilter()).length > 0;
        }
    }
    getKeys() {
        return Object.keys(this.getValidFilter());
    }
    hasReservation() {
        return this.hasValues('appointment_date');
    }
    getReservation() {
        return this.getBetweenInUnix('appointment_date');
    }
}
exports.DatesFilterModel = DatesFilterModel;
class FieldsFilterModel {
    constructor(rawFilter) {
        this.rawFilter = rawFilter;
        this.validFilter = this.getValidFilter(rawFilter);
    }
    hasValue(value) {
        if (_.isNil(value))
            return false;
        if (typeof value === 'string') {
            return value.length === 0;
        }
        return true;
    }
    adjustKeysTo(...keys) {
        Object.keys(this.validFilter).forEach((filterKey) => {
            if (!keys.includes(filterKey)) {
                delete this.validFilter[filterKey];
            }
        });
    }
    getValidFilter(filter) {
        const correctFilter = {};
        Object.keys(filter).forEach((key) => {
            const option = filter[key];
            if (!option) {
                return;
            }
            let values = [];
            const options = {};
            if (_.isPlainObject(option)) {
                values = option['values'] || [];
                Object.assign(options, _.omit(option, 'values'));
            }
            else {
                values = _.flatten(option);
            }
            _.remove(values, this.hasValue);
            if (values.length === 0) {
                return;
            }
            correctFilter[key] = {
                values,
                options
            };
        });
        return correctFilter;
    }
    isEmpty() {
        return Object.keys(this.validFilter).length === 0;
    }
    getValues(key) {
        if (this.hasValues(key)) {
            return this.validFilter[key].values;
        }
        return [];
    }
    getOptionValue(key, optionName) {
        if (!this.hasValues(key)) {
            return null;
        }
        return this.validFilter[key].options[optionName];
    }
    hasValues(key) {
        return this.validFilter[key] && this.validFilter[key].values.length > 0;
    }
    getValuesForCategoryFilter(key) {
        const rawValues = this.getValues(key);
        const result = {
            tag1: undefined,
            tag2: undefined,
            tag3: undefined,
            id: undefined,
        };
        rawValues.forEach((rawParameter) => {
            const parts = rawParameter.split(":");
            const key = parts[0];
            if (key === 'id') {
                result[key] = parts[1].split("_")[0];
            }
            else {
                result[key] = parts[1];
            }
        });
        return result;
    }
    getKeys() {
        return Object.keys(this.validFilter);
    }
    ignore(key) {
        if (!key)
            return this;
        const map = this.rawFilter;
        delete map[key];
        return new FieldsFilterModel(map);
    }
}
exports.FieldsFilterModel = FieldsFilterModel;
const fixReservationDaysInterval = ({ from, to }) => {
    const fromStr = from || '1970-01-01';
    const toStr = to || '2050-01-01';
    return {
        from: luxon_1.DateTime.fromISO(fromStr).startOf('day').toSeconds(),
        to: luxon_1.DateTime.fromISO(toStr).endOf('day').toSeconds()
    };
};
exports.fixReservationDaysInterval = fixReservationDaysInterval;
class RequestExpressionsBuilder {
    join(logic, ...expressions) {
        const expressionString = expressions
            .filter((subex) => !_.isEmpty(subex.expressionString))
            .map((e) => {
            if (e.expressionString.indexOf(' OR ') > -1) {
                return `(${e.expressionString})`;
            }
            return e.expressionString;
        }).join(` ${logic} `);
        const argumentsMapping = Object.assign({}, ...(expressions.map(e => e.argumentsMapping)));
        const valuesMapping = Object.assign({}, ...(expressions.map(e => e.valuesMapping)));
        return {
            expressionString,
            valuesMapping,
            argumentsMapping,
        };
    }
    static get emptyExpression() {
        return {
            expressionString: '',
            argumentsMapping: {},
            valuesMapping: {},
        };
    }
    joinOr(...expressions) {
        return this.join('OR', ...expressions);
    }
    joinAnd(...expressions) {
        return this.join('AND', ...expressions);
    }
    makeOr(name, values, mode = 'exact') {
        if (_.isNil(values)) {
            return RequestExpressionsBuilder.emptyExpression;
        }
        const expressions = values.map((value, index) => this.makeWithLogic(name, index, value, mode));
        return this.joinOr(...expressions);
    }
    makeOrEqual(name, values) {
        if (_.isNil(values)) {
            return RequestExpressionsBuilder.emptyExpression;
        }
        const expressions = values.map((value, index) => this.makeEqual(name, index, value));
        return this.joinOr(...expressions);
    }
    makeWithLogic(name, index, value, mode = 'exact') {
        if (_.isNil(value)) {
            return RequestExpressionsBuilder.emptyExpression;
        }
        if (value === exports.NULL_VALUE_STR) {
            return {
                expressionString: `#${name}_${index} = :null OR attribute_not_exists(#${name}_${index})`,
                argumentsMapping: { [`#${name}_${index}`]: name },
                valuesMapping: { [`:null`]: null },
            };
        }
        let expressionString;
        switch (mode) {
            case 'contains': {
                expressionString = `contains(#${name}_${index}, :${name}_${index})`;
                break;
            }
            default: {
                expressionString = `#${name}_${index} = :${name}_${index}`;
                break;
            }
        }
        return {
            expressionString: expressionString,
            argumentsMapping: { [`#${name}_${index}`]: name },
            valuesMapping: { [`:${name}_${index}`]: value },
        };
    }
    makeEqual(name, index, value) {
        if (_.isNil(value)) {
            return RequestExpressionsBuilder.emptyExpression;
        }
        return {
            expressionString: `#${name}_${index} = :${name}_${index}`,
            argumentsMapping: { [`#${name}_${index}`]: name },
            valuesMapping: { [`:${name}_${index}`]: value },
        };
    }
    makeInterval(name, { from, to }) {
        if (_.isNil(from) && _.isNil(to)) {
            return RequestExpressionsBuilder.emptyExpression;
        }
        if (_.isNil(to)) {
            return {
                expressionString: `#${name} >= :${name}`,
                argumentsMapping: { [`#${name}`]: name },
                valuesMapping: { [`:${name}`]: from },
            };
        }
        if (_.isNil(from)) {
            return {
                expressionString: `#${name} <= :${name}`,
                argumentsMapping: { [`#${name}`]: name },
                valuesMapping: { [`:${name}`]: to },
            };
        }
        return {
            expressionString: `#${name} BETWEEN :${name}_from AND :${name}_to`,
            argumentsMapping: { [`#${name}`]: name },
            valuesMapping: { [`:${name}_from`]: from, [`:${name}_to`]: to, },
        };
    }
}
exports.RequestExpressionsBuilder = RequestExpressionsBuilder;
const startDayToUnixSeconds = (stringDay) => {
    if (!stringDay)
        return 0;
    return luxon_1.DateTime.fromISO(stringDay).startOf("day").toSeconds();
};
const endDayToUnixSeconds = (stringDay) => {
    if (!stringDay)
        return 2531881600;
    return luxon_1.DateTime.fromISO(stringDay).endOf("day").toSeconds();
};
const SURROGATE_FIELDS = ['indexId', 'userSearchKey', 'sortKey', 'partitionKey', 'title'];
const INDIVIDUAL_FIELDS = ['itemKey', 'value'];
const COMMON_FIELDS_OMIT = [...SURROGATE_FIELDS, ...INDIVIDUAL_FIELDS];
class ItemsMergeHelper {
    constructor() {
    }
    groupAndMerge(items) {
        const grouped = Object
            .entries(_.groupBy(items, 'partitionKey'))
            .map(([pk, items]) => ({ id: pk, items }));
        return this.mergeRecords(grouped);
    }
    mergeRecords(groupedLines) {
        return groupedLines.map((group) => {
            const singleItem = _.omit(group.items[0], ...COMMON_FIELDS_OMIT);
            return Object.assign(Object.assign({ partitionKey: group.id }, singleItem), { fields: group.items.map((item) => _.pick(item, INDIVIDUAL_FIELDS)) });
        });
    }
}
exports.ItemsMergeHelper = ItemsMergeHelper;
class MergedResultsModel {
    constructor(merged) {
        this.record = merged;
    }
    getFieldValue(key) {
        const field = this.record.fields.find((f) => f.itemKey === key);
        return field ? field.value : null;
    }
    isCheckIn(checkValues) {
        return (checkValues.includes(this.record['check'] || ''));
    }
    isUpdatedAtIn(from, to) {
        const value = this.record['updatedAt'] || 0;
        return value >= from && value <= to;
    }
    isCreatedAtIn(from, to) {
        const value = this.record['createdAt'] || 0;
        return value >= from && value <= to;
    }
    isFieldIn(itemKey, values, mode = 'exact') {
        const fieldValue = this.getFieldValue(itemKey) || '';
        if (mode === 'exact') {
            return values.includes(fieldValue);
        }
        return values.some((value) => fieldValue.indexOf(value) > -1);
    }
    isAppointmentIn(itemKey, from, to) {
        const line = this.getFieldValue(itemKey);
        if (!line)
            return false;
        const itemModel = new results_model_1.ReservationLineModel({ value: line });
        if (!itemModel.hasValidDate) {
            return false;
        }
        return itemModel.timestamp >= from && itemModel.timestamp <= to;
    }
    isCategoryIn(itemKey, categoryIds) {
        const line = this.getFieldValue(itemKey);
        if (!line)
            return false;
        const itemModel = new results_model_1.ReservationLineModel({ value: line });
        if (!itemModel.hasValidCategory) {
            return false;
        }
        return categoryIds.includes(itemModel.categoryIdPrefix);
    }
    getCategoryId(itemKey) {
        const line = this.getFieldValue(itemKey);
        if (!line)
            return null;
        const itemModel = new results_model_1.ReservationLineModel({ value: line });
        if (!itemModel.hasValidCategory) {
            return null;
        }
        return itemModel.categoryIdPrefix;
    }
}
class MergedResultsFilter {
    constructor(fields, dates, reservationKey) {
        this.fields = fields;
        this.dates = dates;
        this.reservationKey = reservationKey;
    }
    set categoriesPredicate(p) {
        this._categoriesPredicate = p;
    }
    setAllowedCategories(categoryIds) {
        this.allowedCategoriesIds = categoryIds;
    }
    buildFilterPredicate() {
        return (item) => {
            const model = new MergedResultsModel(item);
            let matches = true;
            const fieldsCheck = this.fields.ignore('check').ignore(this.reservationKey).getKeys();
            fieldsCheck.forEach((key) => {
                const searchMode = this.fields.getOptionValue(key, 'mode') || 'exact';
                matches = matches && model.isFieldIn(key, this.fields.getValues(key), searchMode);
            });
            if (!matches)
                return false;
            if (this.fields.hasValues('check')) {
                matches = matches && model.isCheckIn(this.fields.getValues('check'));
            }
            if (!matches)
                return false;
            if (this.dates.hasValues('createdAt')) {
                const interval = this.dates.getBetweenInUnix('createdAt');
                if (interval) {
                    matches = matches && model.isCreatedAtIn(interval.from, interval.to);
                }
            }
            if (!matches)
                return false;
            if (this.dates.hasValues('updatedAt')) {
                const interval = this.dates.getBetweenInUnix('updatedAt');
                if (interval) {
                    matches = matches && model.isUpdatedAtIn(interval.from, interval.to);
                }
            }
            if (!matches)
                return false;
            if (this.reservationKey && this.dates.hasValues('appointment_date')) {
                const interval = this.dates.getBetweenInUnix('appointment_date');
                if (interval) {
                    matches = matches && model.isAppointmentIn(this.reservationKey, interval.from, interval.to);
                }
            }
            if (!matches)
                return false;
            if (this.reservationKey
                && this.fields.hasValues(this.reservationKey)
                && this.allowedCategoriesIds) {
                matches = matches && model.isCategoryIn(this.reservationKey, this.allowedCategoriesIds);
            }
            if (this.reservationKey) {
                const categoryId = model.getCategoryId(this.reservationKey);
                if (this._categoriesPredicate && categoryId) {
                    matches = matches && this._categoriesPredicate(categoryId);
                }
            }
            return matches;
        };
    }
    doFiltering(items) {
        return items.filter(this.buildFilterPredicate());
    }
}
exports.MergedResultsFilter = MergedResultsFilter;
