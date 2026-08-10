import * as fs from 'fs';
import * as path from 'path';
import { Scenario } from './parser';

export interface GeneratorOptions {
  stepsDir?: string;
  setupHeader?: string;
  beforeScenario?: string;
  afterScenario?: string;
  getScenarioContext?: string;
  thresholds?: string[];
}

export function discoverStepImports(stepsDir: string): { absPath: string; exportName: string }[] {
  if (!fs.existsSync(stepsDir)) return [];
  return fs.readdirSync(stepsDir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    .map(f => {
      const absPath = path.join(stepsDir, f);
      const name = f.replace(/\.(ts|js)$/, '').replace(/[-_.]([a-z])/g, (_, c) => c.toUpperCase());
      const exportName = name + 'Steps';
      return { absPath, exportName };
    });
}

export function generateScript(scenarios: Scenario[], resources: Record<string, any[]>, options: GeneratorOptions = {}): string {
  const runnerPath = path.join(__dirname, 'step-runner.js');
  const summaryPath = path.join(__dirname, 'handle-summary.js');
  const registryPath = path.join(__dirname, 'step-registry.js');

  const stepsDir = options.stepsDir ? path.resolve(options.stepsDir) : null;
  const imports = stepsDir ? discoverStepImports(stepsDir) : [];

  // Each step file exports a single factory function — `export default (Given, When, Then,
  // And, But) => { ... }` — rather than building its own registry. k6 only resolves relative
  // or absolute file paths (never bare `node_modules` specifiers), so a step file has no way to
  // reach back into this package's own registry at runtime; injecting Given/When/Then as plain
  // arguments into one registry shared across all step files sidesteps that entirely — step
  // files need no k6-gherkin import of any kind to register steps.
  const importLines = imports
    .map(({ absPath, exportName }) => `import ${exportName} from '${absPath}';`)
    .join('\n');

  const registerLines = imports
    .map(({ exportName }) => `${exportName}(Given, When, Then, And, But);`)
    .join('\n');

  const setupHeader = options.setupHeader || '';
  const beforeScenario = options.beforeScenario || '';
  const afterScenario = options.afterScenario || '';
  const getScenarioContext = options.getScenarioContext || 'return {};';
  const thresholds = options.thresholds || ["checks: ['rate > 0.98']"];

  const byFeature = new Map<string, Scenario[]>();
  for (const scenario of scenarios) {
    const key = scenario.featureName || 'Unknown Feature';
    if (!byFeature.has(key)) byFeature.set(key, []);
    byFeature.get(key)!.push(scenario);
  }

  const featureBlocks = Array.from(byFeature.entries()).map(([featureName, featureScenarios]) => {
    return featureScenarios.map(({ name, steps }) => {
      const stepsJson = JSON.stringify(steps, null, 6)
        .split('\n').map((l, i) => i === 0 ? l : '      ' + l).join('\n');
      const featureJson = JSON.stringify(featureName);
      const scenarioJson = JSON.stringify(name);

      return `
  ${beforeScenario}
  try {
    const customCtx = (() => { ${getScenarioContext} })();
    await runScenario(${stepsJson}, allStepDefs, freshCtx(customCtx, ${featureJson}, ${scenarioJson}));
  } catch (e) {
    k6check(null, { [${featureJson} + ' | ' + ${scenarioJson} + ' | (error) | ' + e.message]: () => false });
  }
  ${afterScenario}`;
    }).join('\n');
  }).join('\n');

  const resourcesJson = JSON.stringify(resources || {});

  return `
import { check as k6check } from 'k6';
import { createRegistry } from '${registryPath}';
${importLines}
import { runScenario } from '${runnerPath}';
import { handleSummary } from '${summaryPath}';
${setupHeader}

export { handleSummary };

const { Given, When, Then, And, But, steps: allStepDefs } = createRegistry();
${registerLines}
const __resources = ${resourcesJson};

export const options = {
  thresholds: {
    ${thresholds.join(',\n    ')}
  },
};

function freshCtx(customCtx, featureName, scenarioName) {
  const SEP = ' | ';
  const ctx = Object.assign(
    { currentStep: '', resources: __resources, _checkCount: 0 },
    customCtx
  );
  ctx.check = (val, specs) => {
    ctx._checkCount++;
    const prefixed = {};
    for (const [k, v] of Object.entries(specs)) {
      prefixed[featureName + SEP + scenarioName + SEP + ctx.currentStep + SEP + k] = v;
    }
    return k6check(val, prefixed);
  };
  return ctx;
}

export default async function () {
${featureBlocks}
}
`.trimStart();
}
