"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lsc_dynamodb_patterns_1 = require("lsc-dynamodb-patterns");
const luxon_1 = require("luxon");
const _ = require("lodash");
class ResultsQueryExecutor {
    constructor(tableName, awsCredentials) {
        this.tableName = tableName;
        this.awsCredentials = awsCredentials;
        this._usedTimeMs = 0;
        this._usedCapacityUnits = 0;
        this._items = [];
        this._limit = 100000;
        this._timeLimit = -1;
        this.attrs = undefined;
        this._adjustPage = true;
        this._requestMaxCount = 100000;
        this.table = new lsc_dynamodb_patterns_1.DDClient.Table(this.tableName, {
            pkField: 'partitionKey',
            skField: 'sortKey'
        }, this.awsCredentials);
    }
    set adjustPage(flag) {
        this._adjustPage = flag;
    }
    set limit(limit) {
        this._limit = limit > 0 ? limit : 100000;
    }
    set attributesToFetch(attrs) {
        this.attrs = attrs;
    }
    set requestMaxTime(limit) {
        this._timeLimit = limit;
    }
    set maxExtractedCount(maxCount) {
        this._requestMaxCount = maxCount;
    }
    async adjustEvaluatedPage(page, previousKey, lastKey) {
        if (previousKey) {
            const partitionKey = previousKey['partitionKey'];
            _.remove(page, (p) => p['partitionKey'] === partitionKey);
        }
        if (lastKey) {
            const partitionKey = lastKey['partitionKey'];
            _.remove(page, (p) => p['partitionKey'] === partitionKey);
            const partialDownloadedItems = await this.table.queryItems({
                query: 'partitionKey = :pk',
                mapping: {
                    [':pk']: partitionKey,
                },
            });
            partialDownloadedItems.forEach(item => page.push(item));
        }
    }
    async performPageRequest(q) {
        let response;
        if (this._timeLimit < 0) {
            response = await this.table.queryPage(q);
        }
        else {
            response = {
                items: [],
                lastEvaluatedKey: q.lastEvaluatedKey,
            };
            const startTime = luxon_1.DateTime.now();
            do {
                const pageResponse = await this.table.queryPage(Object.assign(Object.assign({}, q), { lastEvaluatedKey: response.lastEvaluatedKey }));
                response.lastEvaluatedKey = pageResponse.lastEvaluatedKey;
                pageResponse.items.forEach(i => response.items.push(i));
            } while (response.lastEvaluatedKey && response.items.length < this._requestMaxCount &&
                (Math.abs(startTime.diffNow('milliseconds').milliseconds) < this._timeLimit * 1000));
        }
        if (this._adjustPage) {
            await this.adjustEvaluatedPage(response.items, q.lastEvaluatedKey, response.lastEvaluatedKey);
        }
        return response;
    }
    async _loadRawLines(queryModel) {
        const projection = _.union(this.attrs, queryModel.requiredAttributes || []);
        const ddtQuery = {
            index: queryModel.indexName,
            mapping: Object.assign(queryModel.valuesMapping, queryModel.argumentsMapping),
            filter: queryModel.filterExpression || undefined,
            query: queryModel.keyExpression,
            reverseSearch: queryModel.reverseScan,
            attributes: projection.length > 0 ? projection : undefined,
        };
        if (queryModel.paginate) {
            const response = await this.performPageRequest(Object.assign(Object.assign({}, ddtQuery), { lastEvaluatedKey: queryModel.lastEvaluatedKey, limit: this._limit }));
            this._items = queryModel.postDownloadFilter
                ? response.items.filter(queryModel.postDownloadFilter)
                : response.items;
            this._lastEvaluatedKey = response.lastEvaluatedKey;
            this._usedCapacityUnits += this.table.getStats().totalOperationCapacity;
        }
        else {
            const items = await this.table.queryItems(ddtQuery);
            this._items = queryModel.postDownloadFilter ? items.filter(queryModel.postDownloadFilter) : items;
            this._lastEvaluatedKey = undefined;
            this._usedCapacityUnits += this.table.getStats().totalOperationCapacity;
        }
    }
    async loadRawLines(queryModel) {
        const time = luxon_1.DateTime.now();
        await this._loadRawLines(queryModel);
        this._usedTimeMs = luxon_1.DateTime.now().toMillis() - time.toMillis();
    }
    get items() {
        return this._items;
    }
    get lastEvaluatedKey() {
        return this._lastEvaluatedKey;
    }
    get usedTimeMs() {
        return this._usedTimeMs;
    }
    get usedCapacityUnits() {
        return this._usedCapacityUnits;
    }
}
exports.default = ResultsQueryExecutor;
