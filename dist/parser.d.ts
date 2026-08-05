export interface ScenarioStep {
    text: string;
    keyword: string;
    dataTable: string[][] | null;
}
export interface Scenario {
    featureName: string;
    name: string;
    steps: ScenarioStep[];
}
export declare function parseFeatures(dir: string): Scenario[];
