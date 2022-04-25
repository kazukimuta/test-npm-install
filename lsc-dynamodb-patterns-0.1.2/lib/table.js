"use strict";
/*
 * Copyright 2020 LINE Fukuoka Corporation
 *
 * LINE Corporation licenses this file to you under the Apache License,
 * version 2.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = void 0;
const _ = require("lodash");
const update_builder_1 = require("./update_builder");
const aws = require('aws-sdk');
class Table {
    constructor(name, config, awsConfig) {
        this.lastOperationStats = {
            totalOperationCapacity: 0
        };
        this.tableName = name;
        this.config = config;
        this.dbClient = new aws.DynamoDB.DocumentClient(awsConfig);
    }
    getDocumentClient() {
        return this.dbClient;
    }
    getConfiguration() {
        return this.config;
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
        const result = await this.dbClient.get({
            TableName: this.tableName,
            Key: this.mapKey(key),
        }).promise();
        this.saveStats(result.ConsumedCapacity);
        return result.Item;
    }
    async putItem(item, key) {
        const result = await this.dbClient.put({
            TableName: this.tableName,
            Item: Object.assign(Object.assign({}, item), this.mapKey(key))
        }).promise();
        this.saveStats(result.ConsumedCapacity);
    }
    async update(item, key) {
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
        const builder = new update_builder_1.UpdateExpressionBuilder(item, { marshallValues: false,
            ignoreAttributes: [this.config.pkField, this.config.skField || ""] });
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
                        Keys: keysBatch.map(this.mapKey),
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
        const result = await this.dbClient.delete({
            TableName: this.tableName,
            Key: this.mapKey(key),
        }).promise();
        this.saveStats(result.ConsumedCapacity);
    }
    async deleteAll() {
        const items = await this.getAllItems();
        const keys = items.map(this.makeKey.bind(this));
        await this.deleteItems(keys);
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
