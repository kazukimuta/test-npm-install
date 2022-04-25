"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lsc_dynamodb_patterns_1 = require("lsc-dynamodb-patterns");
const luxon_1 = require("luxon");
class ResultsCounter {
    constructor(databaseName, credentials) {
        this.databaseName = databaseName;
        this.credentials = credentials;
        this._maxExecutionLengthMs = 20000;
    }
    set maxExecutionLengthMs(ms) {
        this._maxExecutionLengthMs = ms;
    }
    async countForSurvey(surveyId, lastEvaluatedKey) {
        const client = new lsc_dynamodb_patterns_1.DDClient.Table(this.databaseName, null, this.credentials);
        let lastKey = lastEvaluatedKey;
        const startedAt = luxon_1.DateTime.now();
        let lastPartitionKey = lastEvaluatedKey ? lastEvaluatedKey.partitionKey : null;
        let counter = 0;
        let itemsCounter = 0;
        do {
            const page = await client.queryPage({
                query: 'surveyId = :surveyId',
                mapping: {
                    ':surveyId': surveyId,
                },
                attributes: ['partitionKey'],
                index: 'surveyId-partitionKey-index',
                lastEvaluatedKey: lastKey,
            });
            lastKey = page.lastEvaluatedKey;
            itemsCounter += page.items.length;
            for (let i = 0; i < page.items.length; i++) {
                const pk = page.items[i].partitionKey;
                if (pk !== lastPartitionKey) {
                    lastPartitionKey = pk;
                    counter++;
                }
            }
        } while (lastKey && -(startedAt.diffNow().milliseconds) < this._maxExecutionLengthMs);
        return {
            uniqueKeys: counter,
            timeUsedMs: -startedAt.diffNow().milliseconds,
            itemsScanned: itemsCounter,
            rruUsed: client.getStats().totalOperationCapacity,
            lastEvaluatedKey: lastKey,
        };
    }
}
exports.default = ResultsCounter;
