"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsQueryBuilder = void 0;
const results_query_helpers_1 = require("./results-query-helpers");
const results_model_1 = require("./results_model");
const _ = require("lodash");
class ResultsQueryBuilder {
    constructor(surveyId, fields, dates, lastEvaluatedKey) {
        this.surveyId = surveyId;
        this.fields = fields;
        this.dates = dates;
        this.lastEvaluatedKey = lastEvaluatedKey;
        this.metadataOnlyMode = false;
        this._categoryPredicate = id => true;
        /**
         *
         * @param key itemKey of type=reservation field
         * @param categoriesToMatch
         */
        this.createReservationDateBasedRequest = (key, categoriesToMatch) => {
            const filterExpression = this.createAndExpressionFor('createdAt', 'updatedAt', 'check');
            const lastEvaluatedKey = _.isPlainObject(this.lastEvaluatedKey) ? this.lastEvaluatedKey : undefined;
            return {
                keyExpression: 'surveyId = :surveyId AND begins_with(sortKey,:key)',
                valuesMapping: Object.assign({ [':surveyId']: this.surveyId, [':key']: key }, filterExpression.valuesMapping),
                argumentsMapping: Object.assign(Object.assign({}, filterExpression.argumentsMapping), { ['#value']: this.metadataOnlyMode ? 'value' : undefined }),
                lastEvaluatedKey,
                filterExpression: filterExpression.expressionString || undefined,
                reverseScan: false,
                paginate: true,
                indexName: 'surveyId-sortKey-index',
                requiredAttributes: this.metadataOnlyMode ? ['#value'] : undefined,
                postDownloadFilter: item => {
                    const itemModel = new results_model_1.ReservationLineModel(item);
                    let result = true;
                    if (!itemModel.hasValidCategory) {
                        return false;
                    }
                    result = result && this._categoryPredicate(itemModel.categoryIdPrefix);
                    if (!result) {
                        return false;
                    }
                    if (categoriesToMatch) {
                        result = result && categoriesToMatch.includes(itemModel.categoryIdPrefix);
                    }
                    const interval = this.dates.getBetweenInUnix('appointment_date');
                    if (interval && !itemModel.hasValidDate) {
                        return false;
                    }
                    if (interval) {
                        result = result && (itemModel.timestamp >= interval.from && itemModel.timestamp <= interval.to);
                    }
                    return result;
                }
            };
        };
    }
    hasSomethingForFieldSearch() {
        if (this.dates.hasValues('appointment_date')) {
            return true;
        }
        if (this.fields.ignore('check').isEmpty()) {
            return false;
        }
        return true;
    }
    set metadataOnly(flag) {
        this.metadataOnlyMode = flag;
    }
    set categoryPredicate(predicate) {
        this._categoryPredicate = predicate;
    }
    willUseSequenceSearch() {
        return this.hasSomethingForFieldSearch();
    }
    canUseParallelSearch() {
        return !this.hasSomethingForFieldSearch()
            && this.fields.hasValues('check')
            && this.fields.getValues('check').length > 1;
    }
    willUseFieldSearch() {
        return !this.willUseSequenceSearch();
    }
    updateAtPrioritySearch(lastEvaluatedKey, reverse = true) {
        let interval = this.dates.getBetweenInUnix('updatedAt');
        if (!interval) {
            interval = { from: 0, to: 2531881600 };
        }
        const filterExpression = this.createAndExpressionFor('check', 'createdAt');
        return {
            keyExpression: 'surveyId = :surveyId and updatedAt BETWEEN :upd_from AND :upd_to',
            valuesMapping: Object.assign({ [':surveyId']: this.surveyId, [':upd_from']: interval.from, [':upd_to']: interval.to }, filterExpression.valuesMapping),
            argumentsMapping: Object.assign({}, filterExpression.argumentsMapping),
            filterExpression: filterExpression.expressionString,
            reverseScan: reverse,
            indexName: 'surveyId-updatedAt-index',
            paginate: true,
            lastEvaluatedKey: lastEvaluatedKey || this.lastEvaluatedKey || undefined,
        };
    }
    createCheckIndexReqeuest(value, lekSupport = false) {
        const filterExpression = this.createAndExpressionFor(...this.dates.getKeys(), ...this.fields.ignore('check').getKeys());
        return {
            keyExpression: 'surveyId = :surveyId and #check = :check ',
            valuesMapping: Object.assign(Object.assign({ [':surveyId']: this.surveyId }, filterExpression), { [':check']: value }),
            argumentsMapping: {
                ['#check']: 'check',
            },
            filterExpression: filterExpression.expressionString || undefined,
            reverseScan: true,
            indexName: 'surveyId-check-index',
            paginate: lekSupport,
            lastEvaluatedKey: this.lastEvaluatedKey || undefined,
        };
    }
    createAndExpressionFor(...keysToBuild) {
        const keys = [...keysToBuild];
        const builder = new results_query_helpers_1.RequestExpressionsBuilder();
        const expressions = keys.map((key) => {
            if (['createdAt', 'updatedAt'].includes(key)) {
                const dates = this.dates.getBetweenInUnix(key);
                if (dates) {
                    return builder.makeInterval(key, dates);
                }
            }
            else if (key === 'check') {
                if (this.fields.hasValues(key)) {
                    const statuses = this.fields.getValues(key);
                    if (statuses.includes('未対応')) {
                        statuses.push(results_query_helpers_1.NULL_VALUE_STR);
                    }
                    return builder.makeOr('check', statuses);
                }
            }
            else {
                if (this.fields.hasValues(key)) {
                    const mode = this.fields.getOptionValue(key, 'mode') || 'exact';
                    return builder.makeOr('value', this.fields.getValues(key), mode);
                }
            }
            return results_query_helpers_1.RequestExpressionsBuilder.emptyExpression;
        });
        return builder.joinAnd(...expressions);
    }
    createResultsMetaAttributesRequest(rowsFilterItemKey, lastEvaluatedKey) {
        const filterExpression = this.createAndExpressionFor('createdAt', 'updatedAt', 'check');
        return {
            keyExpression: 'surveyId = :surveyId and begins_with(sortKey, :sk)',
            valuesMapping: Object.assign(Object.assign({ [':surveyId']: this.surveyId }, filterExpression.valuesMapping), { [':sk']: rowsFilterItemKey }),
            argumentsMapping: Object.assign({}, filterExpression.argumentsMapping),
            filterExpression: filterExpression.expressionString || undefined,
            reverseScan: false,
            indexName: 'surveyId-sortKey-index',
            paginate: true,
            lastEvaluatedKey: lastEvaluatedKey || this.lastEvaluatedKey || undefined,
        };
    }
    createFilterExpressionOnlyRequest(lastEvaluatedKey) {
        const filterExpression = this.createAndExpressionFor('createdAt', 'updatedAt', 'check');
        return {
            keyExpression: 'surveyId = :surveyId',
            valuesMapping: Object.assign({ [':surveyId']: this.surveyId }, filterExpression.valuesMapping),
            argumentsMapping: Object.assign({}, filterExpression.argumentsMapping),
            filterExpression: filterExpression.expressionString || undefined,
            reverseScan: false,
            indexName: 'surveyId-partitionKey-index',
            paginate: true,
            sortKeyName: 'partitionKey',
            lastEvaluatedKey: lastEvaluatedKey || this.lastEvaluatedKey || undefined,
        };
    }
    createParallelSearchQueryModel(key, value) {
        const filterBy = ['check', 'createdAt', 'updatedAt'];
        const searchMode = this.fields.getOptionValue(key, 'mode') || 'exact';
        const useNonExactSearch = searchMode !== 'exact';
        if (useNonExactSearch) {
            filterBy.push(key);
            const filterExpression = this.createAndExpressionFor(...filterBy);
            return {
                keyExpression: 'surveyId = :surveyId AND begins_with(sortKey, :sortKey)',
                valuesMapping: Object.assign({ [':surveyId']: this.surveyId, [':sortKey']: `${key}#` }, filterExpression.valuesMapping),
                argumentsMapping: Object.assign({}, filterExpression.argumentsMapping),
                filterExpression: filterExpression.expressionString,
                reverseScan: false,
                indexName: 'surveyId-sortKey-index',
            };
        }
        const filterExpression = this.createAndExpressionFor(...filterBy, key);
        return {
            keyExpression: 'surveyId = :surveyId AND sortKey = :sortKey',
            valuesMapping: Object.assign({ [':surveyId']: this.surveyId, [':sortKey']: `${key}#${value}` }, filterExpression.valuesMapping),
            argumentsMapping: Object.assign({}, filterExpression.argumentsMapping),
            filterExpression: filterExpression.expressionString,
            reverseScan: false,
            indexName: 'surveyId-sortKey-index',
        };
    }
    checkSearchParallelQueryModel() {
        return {
            values: this.fields.getValues('check'),
            factory: (val) => this.createCheckIndexReqeuest(val, false),
        };
    }
    checkSearchSimpleQueryModel() {
        return this.createCheckIndexReqeuest(this.fields.getValues('check')[0], true);
    }
}
exports.ResultsQueryBuilder = ResultsQueryBuilder;
