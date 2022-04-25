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
exports.UpdateExpressionBuilder = void 0;
const aws_sdk_1 = require("aws-sdk");
class UpdateExpressionBuilder {
    constructor(propertiesMap, opts) {
        this.setExpressions = [];
        this.deleteExpressions = [];
        this.expressionAttributeNames = {};
        this.expressionAttributeValues = {};
        this.source = propertiesMap;
        this.opts = Object.assign({ ignoreAttributes: [], deleteKeysIfUndefinedValue: false, marshallValues: true }, opts);
    }
    build() {
        const keys = Object.keys(this.source);
        keys.filter((k) => { var _a; return !((_a = this.opts.ignoreAttributes) === null || _a === void 0 ? void 0 : _a.includes(k)); }).forEach((key) => {
            const value = this.source[key];
            if (value === undefined && this.opts.deleteKeysIfUndefinedValue) {
                this.deleteExpressions.push(`#${key}`);
                this.expressionAttributeNames[`#${key}`] = key;
                return;
            }
            this.setExpressions.push(`#${key} = :${key}`);
            this.expressionAttributeNames[`#${key}`] = key;
            let marshalled = value;
            if (this.opts.marshallValues) {
                if (typeof value === "object" && !Array.isArray(value)) {
                    marshalled = {
                        M: aws_sdk_1.DynamoDB.Converter.marshall(value, { convertEmptyValues: true }),
                    };
                }
                else {
                    marshalled = aws_sdk_1.DynamoDB.Converter.input(value, { convertEmptyValues: true });
                }
            }
            this.expressionAttributeValues[`:${key}`] = marshalled;
        });
    }
    ;
    addSetExpression(expression, mapping) {
        this.setExpressions.push(expression);
        if (mapping) {
            Object.keys(mapping).forEach((m) => {
                if (m.startsWith('#')) {
                    this.expressionAttributeNames[m] = mapping[m];
                }
                if (m.startsWith(":")) {
                    this.expressionAttributeValues[m] = mapping[m];
                }
            });
        }
    }
    getSetExpression() {
        let expr = '';
        if (this.setExpressions.length > 0) {
            expr += `SET ${this.setExpressions.join(', ')}`;
        }
        if (this.deleteExpressions.length > 0) {
            expr += ` REMOVE ${this.deleteExpressions.join(', ')}`;
        }
        return expr.trim();
    }
    ;
    getExpressionAttributeNames() {
        return this.expressionAttributeNames;
    }
    ;
    getExpressionAttributeValues() {
        return this.expressionAttributeValues;
    }
    ;
    printDebug() {
        console.log('SetExpr:', this.getSetExpression());
        console.log('ExAtNa:', this.getExpressionAttributeNames());
        console.log('ExAtVal:', JSON.stringify(this.getExpressionAttributeValues(), null, 2));
    }
}
exports.UpdateExpressionBuilder = UpdateExpressionBuilder;
