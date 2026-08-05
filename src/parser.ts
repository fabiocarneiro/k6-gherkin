import { Parser, AstBuilder, GherkinClassicTokenMatcher, compile } from '@cucumber/gherkin';
import * as fs from 'fs';
import * as path from 'path';

export interface ScenarioStep {
  text: string;
  keyword: string;
  dataTable: string[][] | null;
}

export interface Scenario {
  featureName: string;
  name: string;
  steps: ScenarioStep[];
}

export function parseFeatures(dir: string): Scenario[] {
  const idGen = (() => { let n = 0; return () => `id-${++n}`; })();
  const parser = new Parser(new AstBuilder(idGen), new GherkinClassicTokenMatcher());

  const scenarios: Scenario[] = [];
  if (!fs.existsSync(dir)) return scenarios;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.feature')).sort();
  for (const file of files) {
    const src = fs.readFileSync(path.join(dir, file), 'utf8');
    const doc = parser.parse(src);
    const featureName = (doc.feature && doc.feature.name) || 'Unknown Feature';

    const stepKeywords: Record<string, string> = {};
    for (const child of (doc.feature && doc.feature.children) || []) {
      const block = (child as any).scenario || (child as any).background;
      if (!block) continue;
      for (const step of block.steps || []) {
        stepKeywords[step.id] = step.keyword.trim();
      }
    }

    const dataTables: Record<string, string[][]> = {};
    const traverse = (node: any) => {
      if (!node) return;
      if (node.steps) {
        for (const s of node.steps) {
          if (s.dataTable) {
            dataTables[s.id] = s.dataTable.rows.map((row: any) => row.cells.map((cell: any) => cell.value));
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
