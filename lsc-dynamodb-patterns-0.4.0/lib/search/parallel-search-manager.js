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
        this.filter = filter;
        this.filter.forEach((filterItem) => {
            this._queryResults[filterItem.key] = {
                filter: filterItem,
                ids: [],
                queryCapacityUnits: 0,
                queryMilliseconds: -1
            };
            this.searchTasksQueue.push(...filterItem.values.map((value => ({ key: filterItem.key, value: value }))));
        });
    }
    mergeQueryResults() {
        const queriesResults = Object.values(this._queryResults).sort((a, b) => a.ids.length - b.ids.length);
        let intersection = queriesResults[0].ids;
        queriesResults.forEach((result) => {
            intersection = _.intersection(intersection, result.ids);
        });
        this.searchResult = intersection;
    }
    async search(callback, pollSize = 10) {
        const executeSearchTask = async (task) => {
            let executionTimeStart = new Date().getTime();
            const stats = {
                consumedCapacityUnits: 0,
            };
            const result = await callback(task.key, task.value, stats);
            const targetTask = this._queryResults[task.key];
            targetTask.ids.push(...result);
            targetTask.queryCapacityUnits += (stats.consumedCapacityUnits || 0);
            targetTask.queryMilliseconds = new Date().getTime() - executionTimeStart;
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
    async collect(callback, pollSize = 10) {
        const executeCollectTask = async (id) => {
            const stats = {
                consumedCapacityUnits: 0,
            };
            const items = await callback(id, stats);
            this.collectResult.push({ id, items: items });
            this._collectionCapacityUnits += (stats.consumedCapacityUnits || 0);
        };
        const executor = new PromisePool(() => {
            const id = this.searchResult.pop();
            if (id) {
                return executeCollectTask(id);
            }
            return;
        }, pollSize);
        const startTime = new Date().getTime();
        await executor.start();
        this._collectMilliseconds = new Date().getTime() - startTime;
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
}
exports.ParallelSearchManager = ParallelSearchManager;
