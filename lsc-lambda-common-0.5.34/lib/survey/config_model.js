"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberConfigModel = exports.SurveyConfigModel = void 0;
const MultiValueType = 'checkboxes';
class SurveyConfigModel {
    constructor(surveyConfig) {
        this.config = surveyConfig;
        this.schema = surveyConfig.surveySchema || [];
    }
    getField(itemKey) {
        return this.schema.find((field) => field.itemKey === itemKey);
    }
    isMultiValue(itemId) {
        const field = this.getField(itemId);
        return field ? field.type === MultiValueType : false;
    }
    isScalarValue(itemId) {
        return !this.isMultiValue(itemId);
    }
    exists(itemId) {
        return !!this.getField(itemId);
    }
    getOrdinal(itemId) {
        const field = this.getField(itemId);
        if (!field)
            return -1;
        return this.schema.indexOf(field);
    }
    isIndexable(itemId) {
        const field = this.getField(itemId);
        return field && field.isIndexable ? field.isIndexable.value : false;
    }
    isSearcheable(itemId) {
        const field = this.getField(itemId);
        return field && field.isSearchable ? field.isSearchable.value : false;
    }
    getSchema() {
        return this.schema;
    }
    getSurveyId() {
        return this.config.surveyId;
    }
    getDefinitionOfType(type) {
        return this.schema.filter((item) => item.type === type);
    }
    hasReservation() {
        return !!this.getDefinitionOfType('reservation')[0];
    }
    getReservationDefinition() {
        const def = this.getDefinitionOfType('reservation')[0];
        if (!def) {
            throw "Bunrui is not defined in this form. Check existence, using hasReservation()";
        }
        return def;
    }
    getReservationFieldKey() {
        if (this.hasReservation()) {
            const def = this.getReservationDefinition();
            return def ? def.itemKey : undefined;
        }
        return undefined;
    }
    getAllKeys() {
        return this.schema.map((field) => {
            return field.itemKey;
        });
    }
    getAllowedTeamsOfCategory(categoryId) {
        if (!this.config.categoriesPermissions) {
            return [];
        }
        return this.config.categoriesPermissions[categoryId] || [];
    }
    hasAccessLimitationsForSomeCategory() {
        if (!this.config.categoriesPermissions) {
            return false;
        }
        return Object.keys(this.config.categoriesPermissions)
            .some((categoryId) => {
            const teams = this.config.categoriesPermissions[categoryId];
            return teams && teams.length > 0;
        });
    }
}
exports.SurveyConfigModel = SurveyConfigModel;
class MemberConfigModel {
    constructor(surveyConfig) {
        this.config = surveyConfig;
        this.schema = surveyConfig.surveySchema || [];
    }
    getField(itemKey) {
        return this.schema.find((field) => field.itemKey === itemKey);
    }
    isMultiValue(itemId) {
        const field = this.getField(itemId);
        return field ? field.type === MultiValueType : false;
    }
    isScalarValue(itemId) {
        return !this.isMultiValue(itemId);
    }
    exists(itemId) {
        return !!this.getField(itemId);
    }
    getOrdinal(itemId) {
        const field = this.getField(itemId);
        if (!field)
            return -1;
        return this.schema.indexOf(field);
    }
    isIndexable(itemId) {
        const field = this.getField(itemId);
        return field && field.isIndexable ? field.isIndexable.value : false;
    }
    isSearcheable(itemId) {
        const field = this.getField(itemId);
        return field && field.isSearchable ? field.isSearchable.value : false;
    }
    getSchema() {
        return this.schema;
    }
    getSurveyId() {
        return this.config.memberSurveyId;
    }
}
exports.MemberConfigModel = MemberConfigModel;
