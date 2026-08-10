/**
 * Step registry for k6 Gherkin step definitions.
 */

export interface StepContext {
  client?: any;
  params?: any;
  currentStep?: string;
  // Not optional: the generated script's freshCtx() always sets this before any step function
  // runs, so every step definition can call ctx.check(...) directly without a null check.
  check: (val: any, specs: Record<string, (val: any) => boolean>) => boolean;
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

export type RegisterFn = (pattern: RegExp, fn: StepFn) => void;

// Individual aliases (rather than one shared RegisterFn everywhere) so a step file's factory
// signature reads as self-documenting keyword-by-keyword types:
//   export default function (Given: Given, When: When, Then: Then) { ... }
export type Given = RegisterFn;
export type When = RegisterFn;
export type Then = RegisterFn;
export type And = RegisterFn;
export type But = RegisterFn;

export interface StepRegistry {
  Given: Given;
  When: When;
  Then: Then;
  And: And;
  But: But;
  steps: StepDef[];
}

// The shape every step file's default export must satisfy: a factory k6-gherkin's generated
// script calls once at module load, passing in the Given/When/Then/And/But shared across all
// step files in stepsDir. Step files never import k6-gherkin at runtime to get these — k6 only
// resolves relative/absolute file paths, never bare node_modules specifiers, so there is no
// runtime path back into this package from inside the k6 VM; injection is the only way in.
export type StepModule = (Given: Given, When: When, Then: Then, And: And, But: But) => void;

export function createRegistry(): StepRegistry {
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
