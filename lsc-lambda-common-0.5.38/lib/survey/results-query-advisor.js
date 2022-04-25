"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const results_query_helpers_1 = require("./results-query-helpers");
class ResultsQueryAdvisor {
    constructor(request) {
        this.request = request;
        this.fields = new results_query_helpers_1.FieldsFilterModel(request.filterCommon);
        this.dates = new results_query_helpers_1.DatesFilterModel(request.filterDate);
    }
    hasSomethingForFieldSearch() {
        if (this.dates.hasValues('appointment_date')) {
            return true;
        }
        if (this.fields.ignore('check').isEmpty()) {
            return false;
        }
        return true;
    }
    shouldUseFieldSearch() {
        return this.shouldUseIndexSearch() &&
            !this.request.lastEvaluatedKey && this.hasSomethingForFieldSearch();
    }
    shouldSearchByUpdatedAt() {
        return this.dates.hasValues('updatedAt');
    }
    shouldSearchByStatus() {
        return this.fields.hasValues('check');
    }
    shouldUseIndexSearch() {
        return false;
    }
    shouldUseFullDataSearch() {
        return true;
    }
}
exports.default = ResultsQueryAdvisor;
