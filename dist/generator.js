"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverStepImports = discoverStepImports;
exports.generateScript = generateScript;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function discoverStepImports(stepsDir) {
    if (!fs.existsSync(stepsDir))
        return [];
    return fs.readdirSync(stepsDir)
        .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
        .map(f => {
        const absPath = path.join(stepsDir, f);
        const name = f.replace(/\.(ts|js)$/, '').replace(/[-_.]([a-z])/g, (_, c) => c.toUpperCase());
        const exportName = name + 'Steps';
        return { absPath, exportName };
    });
}
function generateScript(scenarios, resources, options = {}) {
    const runnerPath = path.join(__dirname, 'step-runner.js');
    const summaryPath = path.join(__dirname, 'handle-summary.js');
    const stepsDir = options.stepsDir ? path.resolve(options.stepsDir) : null;
    const imports = stepsDir ? discoverStepImports(stepsDir) : [];
    const importLines = imports
        .map(({ absPath, exportName }) => `import * as ${exportName}Module from '${absPath}';\nconst ${exportName} = ${exportName}Module.default || ${exportName}Module.${exportName} || ${exportName}Module.steps || [];`)
        .join('\n');
    const stepDefArray = imports.map(({ exportName }) => `...${exportName}`).join(', ');
    const setupHeader = options.setupHeader || '';
    const beforeScenario = options.beforeScenario || '';
    const afterScenario = options.afterScenario || '';
    const getScenarioContext = options.getScenarioContext || 'return {};';
    const thresholds = options.thresholds || ["checks: ['rate > 0.98']"];
    const byFeature = new Map();
    for (const scenario of scenarios) {
        const key = scenario.featureName || 'Unknown Feature';
        if (!byFeature.has(key))
            byFeature.set(key, []);
        byFeature.get(key).push(scenario);
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
${importLines}
import { runScenario } from '${runnerPath}';
import { handleSummary } from '${summaryPath}';
${setupHeader}

export { handleSummary };

const allStepDefs = [${stepDefArray}];
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
