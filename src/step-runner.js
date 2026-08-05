/**
 * Async step executor for Gherkin scenarios in k6.
 */

export async function runScenario(steps, allStepDefs, ctx) {
  for (const step of steps) {
    const keyword = step.keyword || '';
    const text = step.text || step;
    ctx.currentStep = keyword ? keyword + ' ' + text : text;
    const match = findStep(allStepDefs, text);
    if (!match) {
      throw new Error(`No step definition matched: "${text}"`);
    }
    const args = [...match.args];
    if (step.dataTable) {
      args.push(step.dataTable);
    }
    const checksBefore = ctx._checkCount || 0;
    try {
      await match.fn(ctx, ...args);
    } catch (e) {
      const statusName = e.status != null ? String(e.status) : null;
      if (ctx.expectedError) {
        const expected = ctx.expectedError;
        if (statusName === expected) {
          ctx.lastError = e;
          ctx.expectedError = null;
          ctx.check(e, { [`received expected "${expected}" error`]: () => true });
        } else {
          ctx.check(null, { [`expected "${expected}" error but got "${statusName || e.message || e}"`]: () => false });
          return;
        }
      } else {
        ctx.check(null, { [e.message || String(e)]: () => false });
        return;
      }
      continue;
    }
    if (ctx._checkCount === checksBefore) {
      ctx.check(true, { 'step executed': () => true });
    }
  }

  if (ctx.expectedError) {
    ctx.check(null, { [`expected "${ctx.expectedError}" error but scenario completed without it`]: () => false });
  }
}

function findStep(allStepDefs, text) {
  for (const def of allStepDefs) {
    const m = text.match(def.pattern);
    if (m) {
      return { fn: def.fn, args: m.slice(1) };
    }
  }
  return null;
}
