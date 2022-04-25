"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = void 0;
const _ = require("lodash");
const update_builder_1 = require("./update_builder");
// import {DynamoDB} from "aws-sdk";
const aws = require("aws-sdk");
class Table {
    constructor(name, config, awsConfig) {
        this.lastOperationStats = {
            totalOperationCapacity: 0
        };
        this.tableName = name;
        this.config = config || { pkField: '' };
        this.awsCfg = {
            region: 'ap-northeast-1'
        };
        if (!awsConfig) {
            this.awsCfg.credentials = new aws.EnvironmentCredentials('AWS');
        }
        else if (typeof awsConfig === 'string') {
            this.awsCfg.credentials = new aws.SharedIniFileCredentials({ profile: awsConfig });
        }
        else if (awsConfig.profile) {
            const profile = awsConfig.profile;
            this.awsCfg.region = awsConfig.region || 'ap-northeast-1';
            this.awsCfg.credentials = new aws.SharedIniFileCredentials({ profile: profile });
        }
        else {
            this.awsCfg = awsConfig;
        }
        this.dbClient = new aws.DynamoDB.DocumentClient({
            credentials: this.awsCfg.credentials,
            region: this.awsCfg.region
        });
    }
    setPrimaryKey(hashKey, sortKey) {
        this.config.pkField = hashKey;
        this.config.skField = sortKey;
    }
    getDocumentClient() {
        return this.dbClient;
    }
    getConfiguration() {
        return this.config;
    }
    async ensureKey() {
        if (this.config.pkField)
            return;
        const client = new aws.DynamoDB(this.awsCfg);
        const table = await client.describeTable({ TableName: this.tableName }).promise();
        if (table.Table && table.Table.KeySchema) {
            const ks = table.Table.KeySchema;
            this.config.pkField = ks.find((t) => t.KeyType === 'HASH').AttributeName;
            const skRec = ks.find((t) => t.KeyType === 'RANGE');
            if (skRec) {
                this.config.skField = skRec.AttributeName;
            }
        }
    }
    mapKey(key) {
        const res = {};
        if (!key)
            return res;
        res[this.config.pkField] = key.pk;
        if (this.config.skField) {
            res[this.config.skField] = key.sk || "";
        }
        return res;
    }
    makeKey(object) {
        let pk = object[this.config.pkField];
        let sk = undefined;
        if (this.config.skField) {
            sk = object[this.config.skField];
        }
        return {
            pk: pk,
            sk: sk,
        };
    }
    async getItem(key) {
        await this.ensureKey();
        const result = await this.dbClient.get({
            TableName: this.tableName,
            Key: this.mapKey(key),
        }).promise();
        this.saveStats(result.ConsumedCapacity);
        return result.Item;
    }
    async putItem(item, key) {
        await this.ensureKey();
        const result = await this.dbClient.put({
            TableName: this.tableName,
            Item: Object.assign(Object.assign({}, item), this.mapKey(key))
        }).promise();
        this.saveStats(result.ConsumedCapacity);
    }
    async update(item, key) {
        await this.ensureKey();
        let targetKey;
        if (key) {
            targetKey = this.mapKey(key);
        }
        else {
            targetKey = {
                [this.config.pkField]: item[this.config.pkField],
            };
            if (this.config.skField) {
                targetKey[this.config.skField] = item[this.config.skField];
            }
        }
        delete item[this.config.pkField];
        if (this.config.skField) {
            delete item[this.config.skField];
        }
        const builder = new update_builder_1.UpdateExpressionBuilder(item, {
            marshallValues: false,
            ignoreAttributes: [this.config.pkField, this.config.skField || ""]
        });
        builder.build();
        const eav = builder.getExpressionAttributeValues();
        const ean = builder.getExpressionAttributeNames();
        const expr = builder.getSetExpression();
        const result = await this.dbClient.update({
            Key: targetKey,
            TableName: this.tableName,
            UpdateExpression: expr,
            ExpressionAttributeNames: ean,
            ExpressionAttributeValues: eav,
            ReturnValues: "ALL_NEW",
        }).promise();
        this.saveStats(result.ConsumedCapacity);
        return result.Attributes;
    }
    resetStats() {
        this.lastOperationStats.totalOperationCapacity = 0;
    }
    getStats() {
        return this.lastOperationStats;
    }
    saveStats(ConsumedCapacity) {
        if (!ConsumedCapacity)
            return;
        this.lastOperationStats.totalOperationCapacity += ConsumedCapacity.CapacityUnits;
    }
    async batchPut(items) {
        await makeBatchRequest(items, async (batchTask, number) => {
            await this.dbClient.batchWrite({
                RequestItems: {
                    [this.tableName]: batchTask.map((t) => {
                        return {
                            PutRequest: {
                                Item: t
                            },
                        };
                    })
                }
            }).promise();
        });
    }
    async batchGet(keys) {
        return await makeBatchRequest(keys, async (keysBatch) => {
            const response = await this.dbClient.batchGet({
                RequestItems: {
                    [this.tableName]: {
                        Keys: keysBatch.map(this.mapKey.bind(this)),
                    }
                }
            }).promise();
            const responses = response.Responses;
            return responses[this.tableName];
        }, 25);
    }
    async getAllItems(filter) {
        const req = {
            TableName: this.tableName,
        };
        if (!filter) {
            filter = { filter: "", mapping: {} };
        }
        if (filter.index) {
            req.IndexName = filter.index;
        }
        if (filter.filter) {
            req.FilterExpression = filter.filter;
        }
        if (filter.mapping) {
            const values = _.pickBy(filter.mapping, (v, k) => k.startsWith(':'));
            const keys = _.pickBy(filter.mapping, (v, k) => k.startsWith('#'));
            if (Object.keys(values).length > 0) {
                req.ExpressionAttributeValues = values;
            }
            if (Object.keys(keys).length > 0) {
                req.ExpressionAttributeNames = keys;
            }
        }
        return await paginateScan(this.dbClient, req);
    }
    async queryItems(query) {
        const req = {
            TableName: this.tableName,
            KeyConditionExpression: query.query,
        };
        if (query.mapping) {
            const values = _.pickBy(query.mapping, (v, k) => k.startsWith(':'));
            const keys = _.pickBy(query.mapping, (v, k) => k.startsWith('#'));
            if (Object.keys(values).length > 0) {
                req.ExpressionAttributeValues = values;
            }
            if (Object.keys(keys).length > 0) {
                req.ExpressionAttributeNames = keys;
            }
        }
        if (query.attributes) {
            req.ProjectionExpression = query.attributes.join(',');
        }
        if (query.filter) {
            req.FilterExpression = query.filter;
        }
        if (query.index) {
            req.IndexName = query.index;
        }
        return await paginateQuery(this.dbClient, req);
    }
    async deleteItems(keys) {
        if (keys.length === 0) {
            return;
        }
        await this.ensureKey();
        await makeBatchRequest(keys, async (keysBatch) => {
            await this.dbClient.batchWrite({
                RequestItems: {
                    [this.tableName]: keysBatch.map((k) => {
                        return {
                            'DeleteRequest': {
                                Key: this.mapKey(k),
                            }
                        };
                    }),
                }
            }).promise();
        }, 25);
    }
    async deleteItem(key) {
        await this.ensureKey();
        const result = await this.dbClient.delete({
            TableName: this.tableName,
            Key: this.mapKey(key),
        }).promise();
        this.saveStats(result.ConsumedCapacity);
    }
    async deleteAll() {
        await this.ensureKey();
        const items = await this.getAllItems();
        const keys = items.map(this.makeKey.bind(this));
        await this.deleteItems(keys);
    }
    async testConnection() {
        const dbClient = new aws.DynamoDB(this.awsCfg);
        try {
            await dbClient.describeTable({ TableName: this.tableName }).promise();
        }
        catch (e) {
            return e.message;
        }
    }
}
exports.Table = Table;
const makeBatchRequest = async (tasks, executor, batchSize = 25) => {
    const result = [];
    let { batch, processed } = _nextBatch(tasks, 0, batchSize);
    let counter = 0;
    while (batch.length > 0) {
        const partialResult = await executor(batch, counter++);
        if (partialResult) {
            result.push(...partialResult);
        }
        const next = _nextBatch(tasks, processed);
        batch = next.batch;
        processed = next.processed;
    }
    return result;
};
const _nextBatch = (arr = [], from = 0, size = 10) => {
    const batch = arr.slice(from, from + size);
    return {
        batch,
        processed: from + batch.length,
    };
};
const paginateQuery = async (client, request) => {
    const result = [];
    let lastKey = undefined;
    let first = true;
    while (lastKey || first) {
        first = false;
        if (lastKey) {
            request.ExclusiveStartKey = lastKey;
        }
        const response = await (client.query(request).promise());
        result.push(...(response.Items || []));
        lastKey = response.LastEvaluatedKey;
    }
    return result;
};
const paginateScan = async (client, request) => {
    const result = [];
    let lastKey = undefined;
    let first = true;
    while (lastKey || first) {
        first = false;
        if (lastKey) {
            request.ExclusiveStartKey = lastKey;
        }
        const response = await (client.scan(request).promise());
        result.push(...(response.Items || []));
        lastKey = response.LastEvaluatedKey;
    }
    return result;
};
