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

export function createRegistry() {
  const steps: StepDef[] = [];
  const reg = (pattern: RegExp, fn: StepFn) => steps.push({ pattern, fn });
  return {
    Given: reg,
    When:  reg,
    Then:  reg,
    And:   reg,
    But:   reg,
    steps,
  };
}
