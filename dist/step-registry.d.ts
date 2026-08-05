/**
 * Step registry for k6 Gherkin step definitions.
 */
export interface StepContext {
    client?: any;
    params?: any;
    currentStep?: string;
    check?: (val: any, specs: Record<string, (val: any) => boolean>) => boolean;
    expectedError?: string;
    lastError?: any;
    resources?: Record<string, any[]>;
    [key: string]: any;
}
export type StepFn = (ctx: StepContext, ...args: any[]) => void | Promise<void>;
export interface StepDef {
    pattern: RegExp;
    fn: StepFn;
}
export interface StepRegistry {
    Given: (pattern: RegExp, fn: StepFn) => void;
    When: (pattern: RegExp, fn: StepFn) => void;
    Then: (pattern: RegExp, fn: StepFn) => void;
    And: (pattern: RegExp, fn: StepFn) => void;
    But: (pattern: RegExp, fn: StepFn) => void;
    steps: StepDef[];
}
export declare function createRegistry(): StepRegistry;
