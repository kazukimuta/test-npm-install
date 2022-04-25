"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberResult = exports.ReservationLineModel = exports.SurveyResult = void 0;
const config_model_1 = require("./config_model");
const _ = require("lodash");
const luxon_1 = require("luxon");
class SurveyResult {
    constructor(answerLines, config) {
        this.answers = answerLines;
        this.configModel = new config_model_1.SurveyConfigModel(config);
    }
    matches(filter) {
        if (filter.logic === 'or') {
            return !!filter.fields.find(this.hasMatchingField.bind(this));
        }
        else {
            return filter.fields.every(this.hasMatchingField.bind(this));
        }
    }
    getStatusOfResultLine() {
        if (this.answers.length > 0) {
            return this.answers[0].check;
        }
        else {
            return null;
        }
    }
    getAnswersByItemId(itemKey) {
        return this.answers.filter((answer) => answer.itemKey === itemKey);
    }
    hasMatchingField(field) {
        const lines = this.getAnswersByItemId(field.itemKey);
        if (lines.length === 0) {
            return false;
        }
        if (lines.length === 1) {
            return (field.value === lines[0].value);
        }
        return lines.some((answer) => field.value === answer.value);
    }
    getValue(itemId) {
        const lines = this.getAnswersByItemId(itemId);
        if (this.configModel.isMultiValue(itemId)) {
            return lines.map((answer) => answer.value || '');
        }
        if (lines.length === 1) {
            return lines[0].value;
        }
        return undefined;
    }
    getLinedAnswers() {
        return _.sortBy(this.answers, _.memoize((answer) => this.configModel.getOrdinal(answer.itemKey)));
    }
    get uid() {
        return this.answers[0].userId;
    }
    get resultId() {
        return this.answers[0].partitionKey;
    }
    static buildFromLines(answers, config) {
        const map = _.groupBy(answers, (answer) => answer.partitionKey);
        return Object.values(map).map((linesOfSurvey) => new SurveyResult(linesOfSurvey, config));
    }
}
exports.SurveyResult = SurveyResult;
class ReservationLineModel {
    constructor(line) {
        this.line = line;
        const parts = line.value.split('|');
        this._categoryId = parts[0];
        this._date = parts[1];
    }
    get hasValidDate() {
        return this._date && this._date.length === 8;
    }
    get hasValidCategory() {
        return !!this._categoryId;
    }
    get rawLine() {
        return this.line;
    }
    get categoryIdPrefix() {
        return this._categoryId.split('_')[0];
    }
    get itemKey() {
        return this.line['itemKey'];
    }
    get categoryId() {
        return this._categoryId;
    }
    get datetime() {
        return luxon_1.DateTime.fromFormat(this._date, 'yyyyMMdd').startOf('day');
    }
    get dateStr() {
        return this._date;
    }
    get timestamp() {
        return this.datetime.toSeconds();
    }
}
exports.ReservationLineModel = ReservationLineModel;
class MemberResult {
    constructor(answerLines, config) {
        this.answers = answerLines;
        this.configModel = new config_model_1.MemberConfigModel(config);
    }
    matches(filter) {
        if (filter.logic === 'or') {
            return !!filter.fields.find(this.hasMatchingField.bind(this));
        }
        else {
            return filter.fields.every(this.hasMatchingField.bind(this));
        }
    }
    getStatusOfResultLine() {
        if (this.answers.length > 0) {
            return this.answers[0].check;
        }
        else {
            return null;
        }
    }
    getAnswersByItemId(itemKey) {
        return this.answers.filter((answer) => answer.itemKey === itemKey);
    }
    hasMatchingField(field) {
        const lines = this.getAnswersByItemId(field.itemKey);
        if (lines.length === 0) {
            return false;
        }
        if (lines.length === 1) {
            return (field.value === lines[0].value);
        }
        return lines.some((answer) => field.value === answer.value);
    }
    getValue(itemId) {
        const lines = this.getAnswersByItemId(itemId);
        if (this.configModel.isMultiValue(itemId)) {
            return lines.map((answer) => answer.value || '');
        }
        if (lines.length === 1) {
            return lines[0].value;
        }
        return undefined;
    }
    getLinedAnswers() {
        return _.sortBy(this.answers, _.memoize((answer) => this.configModel.getOrdinal(answer.itemKey)));
    }
    get uid() {
        return this.answers[0].userId;
    }
    get resultId() {
        return this.answers[0].partitionKey;
    }
    static buildFromLines(answers, config) {
        const map = _.groupBy(answers, (answer) => answer.partitionKey);
        return Object.values(map).map((linesOfSurvey) => new MemberResult(linesOfSurvey, config));
    }
}
exports.MemberResult = MemberResult;
