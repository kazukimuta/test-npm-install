import { ResultSearchRequest } from "./results-query-helpers";
export default class ResultsQueryAdvisor {
    private request;
    private dates;
    private fields;
    constructor(request: ResultSearchRequest);
    private hasSomethingForFieldSearch;
    shouldUseFieldSearch(): boolean;
    shouldSearchByUpdatedAt(): boolean;
    shouldSearchByStatus(): boolean;
    shouldUseIndexSearch(): boolean;
    shouldUseFullDataSearch(): boolean;
}
