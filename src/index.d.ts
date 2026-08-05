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

export function createRegistry(): StepRegistry;

export function runScenario(steps: any[], allStepDefs: StepDef[], ctx: StepContext): Promise<void>;

export function handleSummary(data: any): { stdout: string };

export interface RunK6Options {
  featuresDir?: string;
  stepsDir?: string;
  resources?: Record<string, any[]>;
  setupHeader?: string;
  beforeScenario?: string;
  afterScenario?: string;
  getScenarioContext?: string;
  thresholds?: string[];
  k6Args?: string[];
  cwd?: string;
}

export function runK6(options?: RunK6Options): void;
