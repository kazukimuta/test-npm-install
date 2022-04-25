export declare type BuilderOptions = {
    deleteKeysIfUndefinedValue?: boolean;
    marshallValues?: boolean;
    ignoreAttributes?: string[];
};
export declare class UpdateExpressionBuilder {
    private setExpressions;
    private deleteExpressions;
    private expressionAttributeNames;
    private expressionAttributeValues;
    readonly opts: BuilderOptions;
    private source;
    constructor(propertiesMap: {
        [key: string]: any;
    }, opts?: BuilderOptions);
    build(): void;
    addSetExpression(expression: string, mapping?: {
        [key: string]: any;
    }): void;
    getSetExpression(): string;
    getExpressionAttributeNames(): {
        [key: string]: string;
    };
    getExpressionAttributeValues(): {
        [key: string]: any;
    };
    printDebug(): void;
}
