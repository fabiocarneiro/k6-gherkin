"use strict";
/**
 * Step registry for k6 Gherkin step definitions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRegistry = createRegistry;
function createRegistry() {
    const steps = [];
    const reg = (pattern, fn) => steps.push({ pattern, fn });
    return {
        Given: reg,
        When: reg,
        Then: reg,
        And: reg,
        But: reg,
        steps,
    };
}
