/**
 * Async step executor for Gherkin scenarios in k6.
 */

import { StepContext, StepDef, StepFn } from './step-registry';
import { ScenarioStep } from './parser';

// A caught step-fn error is inherently unknown at compile time (step definitions can throw
// anything), but expectedError matching is a duck-typed convention: an error object carrying a
// `status` and/or `message`. This is the minimal shape that convention relies on.
interface StepError {
  status?: string | number;
  message?: string;
}

export async function runScenario(steps: (string | ScenarioStep)[], allStepDefs: StepDef[], ctx: StepContext): Promise<void> {
  for (const raw of steps) {
    // runScenario also accepts plain strings (not just parser-produced ScenarioStep objects), for
    // callers that build their own step list instead of going through parseFeatures.
    const step: ScenarioStep = typeof raw === 'string' ? { text: raw, keyword: '', dataTable: null } : raw;
    const keyword = step.keyword || '';
    const text = step.text;
    ctx.currentStep = keyword ? keyword + ' ' + text : text;
    const match = findStep(allStepDefs, text);
    if (!match) {
      throw new Error(`No step definition matched: "${text}"`);
    }
    const args: (string | string[][])[] = [...match.args];
    if (step.dataTable) {
      args.push(step.dataTable);
    }
    const checksBefore = ctx._checkCount || 0;
    try {
      await match.fn(ctx, ...args);
    } catch (e: unknown) {
      const err = (typeof e === 'object' && e !== null ? e : {}) as StepError;
      const statusName = err.status != null ? String(err.status) : null;
      if (ctx.expectedError) {
        const expected = ctx.expectedError;
        if (statusName === expected) {
          ctx.lastError = e;
          ctx.expectedError = undefined;
          ctx.check!(e, { [`received expected "${expected}" error`]: () => true });
        } else {
          ctx.check!(null, { [`expected "${expected}" error but got "${statusName || err.message || String(e)}"`]: () => false });
          return;
        }
      } else {
        ctx.check!(null, { [err.message || String(e)]: () => false });
        return;
      }
      continue;
    }
    if (ctx._checkCount === checksBefore) {
      ctx.check!(true, { 'step executed': () => true });
    }
  }

  if (ctx.expectedError) {
    ctx.check!(null, { [`expected "${ctx.expectedError}" error but scenario completed without it`]: () => false });
  }
}

function findStep(allStepDefs: StepDef[], text: string): { fn: StepFn; args: string[] } | null {
  for (const def of allStepDefs) {
    const m = text.match(def.pattern);
    if (m) {
      return { fn: def.fn, args: m.slice(1) };
    }
  }
  return null;
}
