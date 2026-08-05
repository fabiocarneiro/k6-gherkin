const { Parser, AstBuilder, GherkinClassicTokenMatcher, compile } = require('@cucumber/gherkin');
const fs = require('fs');
const path = require('path');

function parseFeatures(dir) {
  const idGen = (() => { let n = 0; return () => `id-${++n}`; })();
  const parser = new Parser(new AstBuilder(idGen), new GherkinClassicTokenMatcher());

  const scenarios = [];
  if (!fs.existsSync(dir)) return scenarios;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.feature')).sort();
  for (const file of files) {
    const src = fs.readFileSync(path.join(dir, file), 'utf8');
    const doc = parser.parse(src);
    const featureName = doc.feature && doc.feature.name;

    const stepKeywords = {};
    for (const child of (doc.feature && doc.feature.children) || []) {
      const block = child.scenario || child.background;
      if (!block) continue;
      for (const step of block.steps || []) {
        stepKeywords[step.id] = step.keyword.trim();
      }
    }

    const dataTables = {};
    const traverse = (node) => {
      if (!node) return;
      if (node.steps) {
        for (const s of node.steps) {
          if (s.dataTable) {
            dataTables[s.id] = s.dataTable.rows.map(row => row.cells.map(cell => cell.value));
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

    const pickles = compile(doc, file, idGen);
    for (const pickle of pickles) {
      scenarios.push({
        featureName,
        name: pickle.name,
        steps: pickle.steps.map(s => ({
          text: s.text,
          keyword: stepKeywords[s.astNodeIds && s.astNodeIds[s.astNodeIds.length - 1]] || '',
          dataTable: dataTables[s.astNodeIds && s.astNodeIds[s.astNodeIds.length - 1]] || null,
        })),
      });
    }
  }
  return scenarios;
}

module.exports = { parseFeatures };
