"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickSearchManager = void 0;
const _ = require("lodash");
const results_query_helpers_1 = require("./results-query-helpers");
const config_model_1 = require("./config_model");
const lsc_dynamodb_patterns_1 = require("lsc-dynamodb-patterns");
const results_query_builder_1 = require("./results-query-builder");
const results_query_executor_1 = require("./results-query-executor");
const parallel_search_manager_1 = require("./support/parallel-search-manager");
const luxon_1 = require("luxon");
class QuickSearchManager {
    constructor(config) {
        this.config = config;
        this.sortConfig = {
            propertyName: null,
            desc: false
        };
        this.fields = new results_query_helpers_1.FieldsFilterModel({});
        this.dates = new results_query_helpers_1.DatesFilterModel({});
        this.metadataAttributes = ['updatedAt'];
        this.maxReturnedCount = 10000;
        this.preloadConfig = { full: false };
        this.accessRules = { teams: [] };
        this.collectionTimeLimit = 25;
        this.categoriesFilteringPredicate = (categoryId) => {
            if (!categoryId) {
                return true;
            }
            if (this.accessRules.teams.length === 0) {
                return true;
            }
            const teams = this.surveyConfig.getAllowedTeamsOfCategory(categoryId);
            if (teams.length === 0) {
                return true;
            }
            return _.intersection(this.accessRules.teams, teams).length > 0;
        };
    }
    setFromSearchRequest(request) {
        this.setFieldsFilter(request.filterCommon);
        this.setDatesFilter(request.filterDate);
        this.setSurvey(request.surveyId);
        this.setLastKey(request.lastEvaluatedKey);
        if (request.sortBy && request.sortBy.length > 0) {
            const reverse = !!(request.sortDesc && request.sortDesc[0]);
            this.setSorting(request.sortBy[0], reverse);
        }
        if (request.options) {
            if (!_.isNil(request.options.maxReturnedCount)) {
                this.setMaxReturnedCount(request.options.maxReturnedCount);
            }
            if (!_.isNil(request.options.maxSearchTime)) {
                this.setCollectionTimeLimit(request.options.maxSearchTime);
            }
        }
    }
    setPreloadConfig(cfg) {
        this.preloadConfig = cfg;
    }
    setSurvey(surveyId, surveyConfig) {
        this.surveyId = surveyId;
        if (surveyConfig) {
            this.surveyConfig = new config_model_1.SurveyConfigModel(surveyConfig);
        }
    }
    setCategoriesLoader(loader) {
        this.categoriesLoader = loader;
    }
    setFieldsFilter(commonFilter) {
        this.fields = new results_query_helpers_1.FieldsFilterModel(commonFilter);
    }
    setDatesFilter(datesFilter) {
        this.dates = new results_query_helpers_1.DatesFilterModel(datesFilter);
    }
    setSorting(propertyName, desc = false) {
        this.sortConfig.propertyName = propertyName;
        this.sortConfig.desc = desc;
    }
    setMetadataAttributes(attributes) {
        this.metadataAttributes = attributes;
    }
    setMaxReturnedCount(count) {
        this.maxReturnedCount = count;
    }
    setLastKey(partitionKey) {
        this.lastKey = partitionKey;
    }
    setAccessRules(rules) {
        this.accessRules = rules;
    }
    setCollectionTimeLimit(limitSeconds) {
        this.collectionTimeLimit = limitSeconds;
    }
    async prepare() {
        if (!this.surveyConfig) {
            const configJson = await this.getSurveyConfig(this.surveyId);
            this.surveyConfig = new config_model_1.SurveyConfigModel(configJson);
        }
        this.fields.adjustKeysTo(...this.surveyConfig.getAllKeys(), 'check');
        this.queryBuilder = new results_query_builder_1.ResultsQueryBuilder(this.surveyConfig.getSurveyId(), this.fields, this.dates, this.lastKey);
        this.queryBuilder.metadataOnly = true;
        this.queryBuilder.categoryPredicate = this.categoriesFilteringPredicate;
    }
    async getSurveyConfig(surveyId) {
        const table = new lsc_dynamodb_patterns_1.DDClient.Table(this.config.surveyConfigTable, {
            pkField: 'surveyId',
        }, this.config.credentials);
        return await table.getItem({ pk: surveyId });
    }
    hasSomethingForFieldSearch() {
        if (this.dates.hasValues('appointment_date')) {
            return true;
        }
        if (this.surveyConfig.hasReservation() && this.surveyConfig.hasAccessLimitationsForSomeCategory()) {
            return true;
        }
        if (this.fields.ignore('check').isEmpty()) {
            return false;
        }
        return true;
    }
    canLimitOnUpdatedAt() {
        return (this.dates.hasValues('updatedAt')) || this.sortConfig.propertyName === 'updatedAt';
    }
    async loadItems(queryModel) {
        const executor = new results_query_executor_1.default(this.config.surveyResultsTable, this.config.credentials);
        executor.limit = this.config.recordsPageLimit || -1;
        if (!this.preloadConfig.full) {
            executor.attributesToFetch = this.metadataAttributes;
            executor.adjustPage = false;
        }
        await executor.loadRawLines(queryModel);
        return {
            items: executor.items,
            lastEvaluatedKey: executor.lastEvaluatedKey,
            usedCapacityUnits: executor.usedCapacityUnits,
            usedTimeMs: executor.usedTimeMs,
        };
    }
    indexSearchFormResult(items) {
        let result = items;
        if (this.sortConfig.propertyName
            && this.metadataAttributes.includes(this.sortConfig.propertyName)) {
            result = _.sortBy(result, this.sortConfig.propertyName);
            if (this.sortConfig.desc) {
                result.reverse();
            }
        }
        if (this.lastKey) {
            const indexOfLastKey = result.findIndex((item) => item.partitionKey === this.lastKey);
            if (indexOfLastKey > -1) {
                result = result.slice(indexOfLastKey + 1);
            }
        }
        if (this.maxReturnedCount < result.length) {
            result = result.slice(0, this.maxReturnedCount);
        }
        return result;
    }
    async indexSearch() {
        const fieldsForParallelization = [];
        const reservationKey = this.surveyConfig.hasReservation()
            && this.surveyConfig.getReservationDefinition().itemKey;
        this.fields.ignore('check').ignore(reservationKey ? reservationKey : undefined)
            .getKeys().forEach((key) => {
            fieldsForParallelization.push({ key, values: this.fields.getValues(key) });
        });
        if (reservationKey
            && (this.dates.hasReservation() || this.fields.hasValues(reservationKey) || this.surveyConfig.hasAccessLimitationsForSomeCategory())) {
            fieldsForParallelization.push({ key: reservationKey, values: ['stub'] });
        }
        const categoriesLoader = this.categoriesLoader;
        const searchCallback = async (key, value, stats) => {
            let queryModel;
            if (reservationKey === key) {
                let categoriesToMatch;
                if (categoriesLoader && this.fields.hasValues(reservationKey)) {
                    categoriesToMatch = await categoriesLoader(this.fields.getValuesForCategoryFilter(reservationKey));
                    if (categoriesToMatch.length === 0) {
                        return [];
                    }
                }
                queryModel = this.queryBuilder.createReservationDateBasedRequest(reservationKey, categoriesToMatch);
            }
            else {
                queryModel = this.queryBuilder.createParallelSearchQueryModel(key, value);
            }
            const { items, usedCapacityUnits } = await this.loadItems(queryModel);
            stats.consumedCapacityUnits = usedCapacityUnits;
            return items;
        };
        const parallelSearchManager = new parallel_search_manager_1.ParallelSearchManager(fieldsForParallelization);
        await parallelSearchManager.search(searchCallback);
        const fullResult = parallelSearchManager.searchResultMeta;
        const resultItems = this.indexSearchFormResult(fullResult);
        const lastEvaluatedKey = (resultItems.length === 0 || resultItems.length === fullResult.length) ? undefined :
            resultItems[resultItems.length - 1]['partitionKey'];
        return {
            results_meta: resultItems,
            totalCount: fullResult.length,
            lastEvaluatedKey,
            rruUsed: parallelSearchManager.queriesCapacityUnits,
            timeUsedMs: parallelSearchManager.searchTimeMilliseconds,
            returnedCount: resultItems.length,
            preLoadedItems: [],
        };
    }
    /**
     * The idea is in finding the field with the highest probability of being presented among all answers in
     * SurveyResults. The type == 'guide' is not real field. Required field would be presented for sure.
     * @private
     */
    getMetaRecordSearchKey() {
        let candidates = this.surveyConfig.getSchema().filter((field) => {
            return field.type !== 'guide';
        });
        const required = candidates.filter((field) => field.isRequired.value);
        if (required.length > 0) {
            candidates = required;
        }
        return candidates[0];
    }
    /**
     * Here we have to scan across all answers and apply FilterExpression. This is the most ineffective search type,
     * but unavoidable, when the filter is not by fields, but metadata like status or update/create date.
     * @private
     */
    async searchByResultsMetaAttributes() {
        let totalCapacity = 0;
        let totalTime = 0;
        let lastKey = this.lastKey;
        let collectedMeta = [];
        const startTime = luxon_1.DateTime.now();
        const metaRecordField = this.getMetaRecordSearchKey();
        const useMetadataSearch = !!metaRecordField;
        do {
            const queryModel = useMetadataSearch
                ? this.queryBuilder.createResultsMetaAttributesRequest(metaRecordField.itemKey, lastKey)
                : this.queryBuilder.createFilterExpressionOnlyRequest(lastKey);
            const { items, usedCapacityUnits, lastEvaluatedKey, usedTimeMs } = await this.loadItems(queryModel);
            if (useMetadataSearch) {
                items.forEach(v => collectedMeta.push(v));
            }
            else {
                const uniqueItems = _.uniqBy(items, 'partitionKey');
                if (lastKey) {
                    _.remove(uniqueItems, (item) => item.partitionKey === lastKey.partitionKey);
                }
                uniqueItems.forEach(v => collectedMeta.push(v));
                collectedMeta = _.uniqBy(collectedMeta, 'partitionKey');
            }
            lastKey = lastEvaluatedKey;
            totalCapacity += usedCapacityUnits;
            totalTime += usedTimeMs;
        } while (lastKey && this.maxReturnedCount > collectedMeta.length
            && Math.abs(startTime.diffNow('milliseconds').milliseconds) < this.collectionTimeLimit * 1000);
        return {
            results_meta: collectedMeta,
            rruUsed: totalCapacity,
            timeUsedMs: totalTime,
            returnedCount: collectedMeta.length,
            totalCount: collectedMeta.length,
            lastEvaluatedKey: lastKey,
            preLoadedItems: [],
        };
    }
    /**
     * In this case all filtering
     * @private
     */
    async fullDataPreload() {
        const queryModel = this.queryBuilder.createFilterExpressionOnlyRequest(this.lastKey);
        const { items, usedCapacityUnits, lastEvaluatedKey, usedTimeMs } = await this.loadItems(queryModel);
        const mergedRecords = new results_query_helpers_1.ItemsMergeHelper().groupAndMerge(items);
        const filter = new results_query_helpers_1.MergedResultsFilter(this.fields, this.dates, this.surveyConfig.getReservationFieldKey());
        filter.categoriesPredicate = this.categoriesFilteringPredicate;
        const reservationKey = this.surveyConfig.hasReservation()
            && this.surveyConfig.getReservationDefinition().itemKey;
        if (reservationKey) {
            const categoriesLoader = this.categoriesLoader;
            const categoriesToMatch = (categoriesLoader && this.fields.hasValues(reservationKey))
                ? await categoriesLoader(this.fields.getValuesForCategoryFilter(reservationKey))
                : undefined;
            filter.setAllowedCategories(categoriesToMatch);
        }
        const filteredItems = filter.doFiltering(mergedRecords);
        return {
            results_meta: [],
            rruUsed: usedCapacityUnits,
            timeUsedMs: usedTimeMs,
            returnedCount: filteredItems.length,
            totalCount: -1,
            lastEvaluatedKey: lastEvaluatedKey,
            preLoadedItems: filteredItems,
        };
    }
    async searchAndGetResults() {
        if (this.preloadConfig.full) {
            return this.fullDataPreload();
        }
        if (this.hasSomethingForFieldSearch()) {
            return this.indexSearch();
        }
        // if (this.canLimitOnUpdatedAt()) {
        //   return this.updatedAtIndexSearch();
        // }
        return this.searchByResultsMetaAttributes();
    }
}
exports.QuickSearchManager = QuickSearchManager;
