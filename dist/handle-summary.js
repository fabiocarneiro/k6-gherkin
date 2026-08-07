"use strict";
/**
 * Formats the k6 check results as a Gherkin-style summary tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSummary = handleSummary;
function handleSummary(data) {
    const allChecks = (data.root_group && data.root_group.checks) || [];
    const SEP = ' | ';
    const featureOrder = [];
    const featureMap = {};
    for (const c of allChecks) {
        const i1 = c.name.indexOf(SEP);
        const i2 = i1 >= 0 ? c.name.indexOf(SEP, i1 + SEP.length) : -1;
        const i3 = i2 >= 0 ? c.name.indexOf(SEP, i2 + SEP.length) : -1;
        if (i1 < 0 || i2 < 0 || i3 < 0)
            continue;
        const feature = c.name.substring(0, i1);
        const scenario = c.name.substring(i1 + SEP.length, i2);
        const step = c.name.substring(i2 + SEP.length, i3);
        if (!featureMap[feature]) {
            featureMap[feature] = {};
            featureOrder.push(feature);
        }
        if (!featureMap[feature][scenario])
            featureMap[feature][scenario] = {};
        if (!featureMap[feature][scenario][step]) {
            featureMap[feature][scenario][step] = { passes: 0, fails: 0 };
        }
        featureMap[feature][scenario][step].passes += c.passes;
        featureMap[feature][scenario][step].fails += c.fails;
    }
    let out = '\n';
    for (const feature of featureOrder) {
        out += 'Feature: ' + feature + '\n';
        for (const [scenario, steps] of Object.entries(featureMap[feature])) {
            out += '\n  Scenario: ' + scenario + '\n';
            for (const [step, result] of Object.entries(steps)) {
                out += (result.fails === 0 ? '    \u2713 ' : '    \u2717 ') + step + '\n';
            }
        }
        out += '\n';
    }
    const cm = data.metrics && data.metrics.checks;
    if (cm) {
        const passes = cm.values.passes || 0;
        const fails = cm.values.fails || 0;
        out += '\u2500'.repeat(60) + '\n';
        out += (fails === 0 ? '\u2713 ' : '\u2717 ') + (passes + fails) + ' checks: ' + passes + ' passed';
        if (fails > 0) {
            out += ', ' + fails + ' FAILED\n\nFailed Checks:\n';
            for (const c of allChecks) {
                if (c.fails > 0) {
                    out += `  - ${c.name} (failed ${c.fails} times)\n`;
                }
            }
        }
        out += '\n';
        if (cm.thresholds) {
            for (const [thr, result] of Object.entries(cm.thresholds)) {
                out += (result.ok ? '\u2713 ' : '\u2717 ') + 'threshold: checks ' + thr + '\n';
            }
        }
    }
    const result = { stdout: out };
    const summaryFile = (typeof __ENV !== 'undefined' && (__ENV.SUMMARY_EXPORT || __ENV.K6_SUMMARY_EXPORT)) || 'summary.json';
    result[summaryFile] = JSON.stringify(data);
    return result;
}
