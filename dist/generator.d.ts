import { Scenario } from './parser';
export interface GeneratorOptions {
    stepsDir?: string;
    setupHeader?: string;
    beforeScenario?: string;
    afterScenario?: string;
    getScenarioContext?: string;
    thresholds?: string[];
}
export declare function discoverStepImports(stepsDir: string): {
    absPath: string;
    exportName: string;
}[];
export declare function generateScript(scenarios: Scenario[], resources: Record<string, any[]>, options?: GeneratorOptions): string;
