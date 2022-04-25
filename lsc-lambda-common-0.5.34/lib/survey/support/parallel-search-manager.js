"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParallelSearchManager = void 0;
const _ = require("lodash");
const PromisePool = require('es6-promise-pool');
class ParallelSearchManager {
    constructor(filter) {
        this._queryResults = {};
        this._searchMilliseconds = -1;
        this.collectResult = [];
        this._collectMilliseconds = -1;
        this._collectionCapacityUnits = 0;
        this.searchTasksQueue = [];
        this.searchResult = [];
        this.resultsMeta = [];
        this.filter = filter;
        this.filter.forEach((filterItem) => {
            this._queryResults[filterItem.key] = {
                filter: filterItem,
                ids: [],
                queryCapacityUnits: 0,
                queryMilliseconds: -1,
                results_meta: [],
                ignore: false,
            };
            filterItem.values
                .map((value => ({ key: filterItem.key, value: value })))
                .forEach(t => this.searchTasksQueue.push(t));
        });
    }
    mergeQueryResults() {
        const summaryMeta = Object.values(this._queryResults)
            .filter(v => !v.ignore)
            .reduce((previousValue, currentValue) => {
            currentValue.results_meta.forEach(v => previousValue.push(v));
            return previousValue;
        }, []);
        const queriesResults = Object.values(this._queryResults)
            .filter(v => !v.ignore)
            .sort((a, b) => a.ids.length - b.ids.length);
        let intersection = queriesResults[0].ids;
        queriesResults.forEach((result) => {
            intersection = _.intersection(intersection, result.ids);
        });
        this.searchResult = intersection;
        const ids = new Set(intersection);
        this.resultsMeta = [];
        summaryMeta.forEach((meta) => {
            if (ids.has(meta.partitionKey)) {
                this.resultsMeta.push(meta);
                ids.delete(meta.partitionKey);
            }
        });
    }
    getResultsCount() {
        return this.resultsMeta.length;
    }
    async search(callback, pollSize = 10) {
        const executeSearchTask = async (task) => {
            let executionTimeStart = new Date().getTime();
            const stats = {
                consumedCapacityUnits: 0,
            };
            const result = await callback(task.key, task.value, stats);
            const targetTask = this._queryResults[task.key];
            if (!targetTask)
                throw 'Null task for ' + task.key;
            if (!result) {
                targetTask.ignore = false;
            }
            else {
                result.forEach(v => targetTask.results_meta.push(v));
                result.map((r) => r.partitionKey).forEach(v => targetTask.ids.push(v));
                targetTask.lastEvaluatedKey = stats.lastEvaluatedKey;
                targetTask.queryCapacityUnits += (stats.consumedCapacityUnits || 0);
                targetTask.queryMilliseconds = new Date().getTime() - executionTimeStart;
            }
        };
        const executor = new PromisePool(() => {
            const task = this.searchTasksQueue.pop();
            if (task) {
                return executeSearchTask(task);
            }
            return;
        }, pollSize);
        const startTime = new Date().getTime();
        await executor.start();
        this.mergeQueryResults();
        this._searchMilliseconds = new Date().getTime() - startTime;
    }
    getLastEvaluatedKeyOfKey(key) {
        const res = this._queryResults[key];
        return res ? res.lastEvaluatedKey : undefined;
    }
    async collect(callback, pollSize = 10) {
    }
    get queriesResults() {
        return Object.values(this._queryResults);
    }
    get searchTimeMilliseconds() {
        return this._searchMilliseconds;
    }
    get collectTimeMilliseconds() {
        return this._collectMilliseconds;
    }
    get queriesCapacityUnits() {
        return _.sumBy(Object.values(this._queryResults), (result) => result.queryCapacityUnits);
    }
    get collectionCapacityUnits() {
        return this._collectionCapacityUnits;
    }
    get collectionResult() {
        return this.collectResult;
    }
    get searchResultIds() {
        return this.searchResult;
    }
    get searchResultMeta() {
        return this.resultsMeta;
    }
}
exports.ParallelSearchManager = ParallelSearchManager;
