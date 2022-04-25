"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyResultsHelper = void 0;
const lib_1 = require("lsc-dynamodb-patterns/lib");
var PromisePool = require('es6-promise-pool');
class SurveyResultsHelper {
    constructor(surveyConfig, config) {
        this.surveyConfig = surveyConfig;
        this.surveyId = surveyConfig.surveyId;
        this.config = Object.assign({ resultsLimit: 100, gsiName: 'indexId-indexSearchKey-index' }, config);
    }
    resultsClient() {
        return new lib_1.DDClient.Table(this.config.resultsTable, {
            pkField: 'partitionKey',
            skField: 'sortKey',
        }, this.config.awsConfig);
    }
    getIndexedKeys() {
        return this.surveyConfig.surveySchema
            .filter((field) => field.isIndexable && field.isIndexable.value)
            .map((field) => field.itemKey);
    }
    findIndexedFields(items) {
        const indexedKeys = this.getIndexedKeys();
        return items.filter((item) => indexedKeys.includes(item.itemKey));
    }
    makeIndexId(surveyId, itemKey) {
        return `${surveyId}#${itemKey}`;
    }
    makeSearchKey(value, uniqueValue) {
        return `${value}$#${uniqueValue}`;
    }
    setIndexValues(items) {
        const indexed = this.findIndexedFields(items);
        for (const record of indexed) {
            const value = record.value || '';
            record.indexSearchKey = this.makeSearchKey(value, record.partitionKey);
            record.indexId = this.makeIndexId(record.surveyId, record.itemKey);
        }
    }
    async queryResultsByField(itemKey, value, lastEvaluatedKey) {
        const indexRecordsResponse = await this.resultsClient().queryPage({
            query: 'indexId = :indexId and begins_with(indexSearchKey, :indexSearchKey)',
            mapping: {
                [':indexId']: this.makeIndexId(this.surveyId, itemKey),
                [':indexSearchKey']: `${value}$`
            },
            index: this.config.gsiName,
            limit: this.config.resultsLimit,
            lastEvaluatedKey,
        });
        const ids = indexRecordsResponse.items.map((item) => item.partitionKey);
        const surveyResultsRecords = [];
        const worker = async (pk) => {
            const items = await this.loadSingleResult(pk);
            surveyResultsRecords.push(...items);
            return;
        };
        const pool = new PromisePool(() => {
            const pk = ids.pop();
            if (pk) {
                return worker(pk);
            }
            return;
        }, 10);
        await pool.start();
        return {
            items: surveyResultsRecords,
            lastEvaluatedKey: indexRecordsResponse.lastEvaluatedKey,
        };
    }
    async loadSingleResult(partitionKey) {
        return await this.resultsClient().queryItems({
            query: 'partitionKey = :pk',
            mapping: {
                ":pk": partitionKey,
            }
        });
    }
}
exports.SurveyResultsHelper = SurveyResultsHelper;
