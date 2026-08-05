/**
 * Async step executor for Gherkin scenarios in k6.
 */
import { StepContext, StepDef } from './step-registry';
export declare function runScenario(steps: any[], allStepDefs: StepDef[], ctx: StepContext): Promise<void>;
