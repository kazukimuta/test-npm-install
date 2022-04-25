"use strict";
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
            if (value === undefined) {
                if (this.opts.deleteKeysIfUndefinedValue) {
                    this.deleteExpressions.push(`#${key}`);
                    this.expressionAttributeNames[`#${key}`] = key;
                    return;
                }
                else {
                    return;
                }
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
