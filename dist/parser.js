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
exports.parseFeatures = parseFeatures;
const gherkin_1 = require("@cucumber/gherkin");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function parseFeatures(dir) {
    const idGen = (() => { let n = 0; return () => `id-${++n}`; })();
    const parser = new gherkin_1.Parser(new gherkin_1.AstBuilder(idGen), new gherkin_1.GherkinClassicTokenMatcher());
    const scenarios = [];
    if (!fs.existsSync(dir))
        return scenarios;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.feature')).sort();
    for (const file of files) {
        const src = fs.readFileSync(path.join(dir, file), 'utf8');
        const doc = parser.parse(src);
        const featureName = (doc.feature && doc.feature.name) || 'Unknown Feature';
        const stepKeywords = {};
        for (const child of (doc.feature && doc.feature.children) || []) {
            const block = child.scenario || child.background;
            if (!block)
                continue;
            for (const step of block.steps || []) {
                stepKeywords[step.id] = step.keyword.trim();
            }
        }
        const dataTables = {};
        const traverse = (node) => {
            if (!node)
                return;
            if (node.steps) {
                for (const s of node.steps) {
                    if (s.dataTable) {
                        dataTables[s.id] = s.dataTable.rows.map((row) => row.cells.map((cell) => cell.value));
                    }
                }
            }
            if (node.children) {
                for (const child of node.children) {
                    traverse(child.scenario || child.background || child.rule);
                }
            }
        };
        traverse(doc.feature);
        const pickles = (0, gherkin_1.compile)(doc, file, idGen);
        for (const pickle of pickles) {
            scenarios.push({
                featureName,
                name: pickle.name,
                // For a plain Scenario, a pickle step has exactly one astNodeId (the step itself).
                // For a Scenario Outline, it has two: the step's own id and the Examples row's id that
                // generated this pickle. Which one comes last is not guaranteed, so we look up against
                // every id and take whichever one actually resolves, rather than assuming position.
                steps: pickle.steps.map(s => ({
                    text: s.text,
                    keyword: (s.astNodeIds && s.astNodeIds.map((id) => stepKeywords[id]).find((k) => k)) || '',
                    dataTable: (s.astNodeIds && s.astNodeIds.map((id) => dataTables[id]).find((t) => t)) || null,
                })),
            });
        }
    }
    return scenarios;
}
