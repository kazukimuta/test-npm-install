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
exports.SurveyResultsIndex = void 0;
const lsc_dynamodb_patterns_1 = require("lsc-dynamodb-patterns");
const aws_sdk_1 = require("aws-sdk");
class SurveyResultsIndex {
    constructor(table, config) {
        this.limit = 0;
        const cfg = config || {};
        this.table = table;
        this.limit = cfg.limit || 100;
        this.itemKey = cfg.itemKey;
        this.surveyId = cfg.surveyId;
        this.awsCredentials = cfg.awsConfig;
    }
    forIndex(surveyId, itemKey) {
        return new SurveyResultsIndex(this.table, {
            surveyId: surveyId,
            itemKey: itemKey,
            awsConfig: this.awsCredentials,
            limit: this.limit,
        });
    }
    setLimit(limit) {
        this.limit = (limit > 0 ? limit : 0);
        return this;
    }
    getIndexDb() {
        return new lsc_dynamodb_patterns_1.DDClient.Table(this.table, { pkField: 'partitionKey', skField: 'sortKey' }, this.awsCredentials);
    }
    indexName() {
        return `ci#${this.surveyId}#${this.itemKey}`;
    }
    async update(resultId, newValue, oldValue) {
        if (oldValue) {
            await this.remove(resultId, oldValue);
        }
        const docClient = new aws_sdk_1.DynamoDB(this.awsCredentials);
        const params = {
            TableName: this.table,
            Key: { partitionKey: { S: this.indexName() }, sortKey: { S: newValue } },
            UpdateExpression: 'ADD results :r',
            ExpressionAttributeValues: {
                [':r']: { SS: [resultId] }
            },
        };
        await docClient.updateItem(params).promise();
    }
    async query(value, lastEvaluatedKey) {
        const docClient = new aws_sdk_1.DynamoDB(this.awsCredentials);
        const params = {
            TableName: this.table,
            KeyConditionExpression: 'partitionKey = :pk and sortKey = :sk',
            ExpressionAttributeValues: {
                [':pk']: { S: this.indexName() },
                [':sk']: { S: value },
            }
        };
        const items = await docClient.query(params).promise();
        if (!items.Items || items.Items.length === 0) {
            return { items: [] };
        }
        let results = (items.Items[0]['results']['SS'] || []).sort();
        if (lastEvaluatedKey) {
            const lastId = lastEvaluatedKey.lastExtractedId;
            const lastIdIndex = results.indexOf(lastId);
            results = results.slice(lastIdIndex + 1);
        }
        let newLastEvaluatedKey = undefined;
        if (this.limit > 0) {
            let lastEvaluatedId = results[this.limit - 1];
            if (lastEvaluatedId) {
                newLastEvaluatedKey = {
                    value: value,
                    lastExtractedId: lastEvaluatedId,
                };
            }
            results = results.slice(0, this.limit);
        }
        return {
            items: results,
            lastEvaluatedKey: newLastEvaluatedKey,
        };
    }
    async remove(resultId, value) {
        const docClient = new aws_sdk_1.DynamoDB(this.awsCredentials);
        const params = {
            TableName: this.table,
            Key: { partitionKey: { S: this.indexName() }, sortKey: { S: value } },
            UpdateExpression: 'DELETE results :r',
            ExpressionAttributeValues: {
                [':r']: { SS: [resultId] }
            },
        };
        await docClient.updateItem(params).promise();
    }
}
exports.SurveyResultsIndex = SurveyResultsIndex;
