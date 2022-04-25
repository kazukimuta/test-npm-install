"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsParallelLoader = void 0;
const parallel_search_manager_1 = require("./support/parallel-search-manager");
const table_1 = require("lsc-dynamodb-patterns/lib/table");
const _ = require("lodash");
const defaultSearchCallback = async (key) => [];
class ResultsParallelLoader {
    constructor(tableName, credentials) {
        this.searchFilter = [];
        this.mergedRecords = [];
        this.totalTime = 0;
        this.consumedCapacity = 0;
        this._searchCallback = defaultSearchCallback;
        this.SURROGATE_FIELDS = ['indexId', 'userSearchKey', 'sortKey', 'partitionKey', 'title'];
        this.INDIVIDUAL_FIELDS = ['itemKey', 'value'];
        this.COMMON_FIELDS_OMIT = [...this.SURROGATE_FIELDS, ...this.INDIVIDUAL_FIELDS];
        this.dbClient = new table_1.Table(tableName, {
            pkField: 'partitionKey',
            skField: 'sortKey',
        }, credentials);
        this._status = {
            result: "not_started",
            resultsToDownload: 0,
        };
    }
    setSurveyId(surveyId) {
        this.surveyId = surveyId;
    }
    addFilter(key, value) {
        const existedParameter = this.searchFilter.find((f) => f.key === key);
        if (existedParameter) {
            existedParameter.values.push(value);
        }
        else {
            this.searchFilter.push({ key: key, values: [value] });
        }
    }
    mergeRecords(groupedLines) {
        return groupedLines.map((group) => {
            const singleItem = _.omit(group.items[0], ...this.COMMON_FIELDS_OMIT);
            return Object.assign(Object.assign({ partitionKey: group.id }, singleItem), { fields: group.items.map((item) => _.pick(item, this.INDIVIDUAL_FIELDS)) });
        });
    }
    set searchCallback(callback) {
        this._searchCallback = callback;
    }
    async handleParametersSearch() {
        this._status.result = 'started';
        const filterWithoutStatuses = this.searchFilter.filter((f) => f.key !== 'check');
        const parallelProcessManager = new parallel_search_manager_1.ParallelSearchManager(filterWithoutStatuses);
        this.dbClient.resetStats();
        await parallelProcessManager.search(async (key, value, stats) => {
            return await this._searchCallback(key, value, this.dbClient, stats);
        });
        if (parallelProcessManager.getResultsCount() > 100) {
            this._status.result = 'too_many_results';
            this._status.resultsToDownload = parallelProcessManager.getResultsCount();
            return;
        }
        await parallelProcessManager.collect(async (id, stats) => {
            return await this.dbClient.queryItems({
                query: 'surveyId = :surveyId and partitionKey = :partitionKey',
                mapping: {
                    [':surveyId']: this.surveyId,
                    [':partitionKey']: id,
                },
                index: 'surveyId-partitionKey-index',
            });
        });
        this.mergedRecords = this.mergeRecords(parallelProcessManager.collectionResult);
        this._status.result = 'done';
    }
    async load() {
        const startAt = new Date().getTime();
        this.dbClient.resetStats();
        await this.handleParametersSearch();
        this.consumedCapacity = this.dbClient.getStats().totalOperationCapacity;
        this.totalTime = new Date().getTime() - startAt;
    }
    isDone() {
        return this._status.result === 'done';
    }
    getStatus() {
        return this._status;
    }
    getTime() {
        return this.totalTime;
    }
    getConsumedCapacity() {
        return this.consumedCapacity;
    }
    getMergedRecords() {
        return this.mergedRecords;
    }
}
exports.ResultsParallelLoader = ResultsParallelLoader;
