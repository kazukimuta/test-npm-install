"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchDownloader = void 0;
const lsc_dynamodb_patterns_1 = require("lsc-dynamodb-patterns");
const results_query_helpers_1 = require("./results-query-helpers");
const luxon_1 = require("luxon");
const PromisePool = require('es6-promise-pool');
class BatchDownloader {
    constructor(resultsTableName, credentials) {
        this.resultsTableName = resultsTableName;
        this.credentials = credentials;
    }
    async download(partitionKeys, pollSize) {
        if (!pollSize) {
            pollSize = partitionKeys.length;
        }
        const client = new lsc_dynamodb_patterns_1.DDClient.Table(this.resultsTableName, { pkField: 'partitionKey', skField: 'sortKey' }, this.credentials);
        const collector = [];
        const helper = new results_query_helpers_1.ItemsMergeHelper();
        const executeDownloadTask = async (partitionKey) => {
            const lines = await client.queryItems({
                query: 'partitionKey = :pk',
                mapping: {
                    [':pk']: partitionKey,
                },
            });
            const records = helper.groupAndMerge(lines);
            records.forEach(t => collector.push(t));
        };
        const copy = [...partitionKeys];
        const executor = new PromisePool(() => {
            const key = copy.pop();
            if (key) {
                return executeDownloadTask(key);
            }
            return;
        }, pollSize);
        const startAt = luxon_1.DateTime.now();
        await executor.start();
        return {
            timeUsedMs: -startAt.diffNow().milliseconds,
            rruUsed: client.getStats().totalOperationCapacity,
            totalCount: collector.length,
            items: collector,
        };
    }
}
exports.BatchDownloader = BatchDownloader;
