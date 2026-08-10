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

export function parseFeatures(input: string): Scenario[] {
  const idGen = (() => { let n = 0; return () => `id-${++n}`; })();
  const parser = new Parser(new AstBuilder(idGen), new GherkinClassicTokenMatcher());

  const scenarios: Scenario[] = [];
  if (!fs.existsSync(input)) return scenarios;

  // Accept either a directory to scan for *.feature files (the normal case -
  // a project's features/ dir) or a single .feature file directly.
  const isDir = fs.statSync(input).isDirectory();
  const dir = isDir ? input : path.dirname(input);
  const files = isDir
    ? fs.readdirSync(input).filter(f => f.endsWith('.feature')).sort()
    : [path.basename(input)];

  for (const file of files) {
    const src = fs.readFileSync(path.join(dir, file), 'utf8');
    const doc = parser.parse(src);
    const featureName = (doc.feature && doc.feature.name) || 'Unknown Feature';

    const stepKeywords: Record<string, string> = {};
    const indexSteps = (block: any) => {
      for (const step of block.steps || []) {
        stepKeywords[step.id] = step.keyword.trim();
      }
    };
    for (const child of (doc.feature && doc.feature.children) || []) {
      const c = child as any;
      if (c.rule) {
        // A Rule's own children (Background/Scenario) aren't at the top level
        // of feature.children - they're nested one level deeper under `rule`.
        for (const ruleChild of c.rule.children || []) {
          const block = ruleChild.scenario || ruleChild.background;
          if (block) indexSteps(block);
        }
      } else {
        const block = c.scenario || c.background;
        if (block) indexSteps(block);
      }
    }

    const pickles = compile(doc, file, idGen);
    for (const pickle of pickles) {
      scenarios.push({
        featureName,
        name: pickle.name,
        // For a plain Scenario, a pickle step has exactly one astNodeId (the step itself).
        // For a Scenario Outline, it has two: the step's own id and the Examples row's id that
        // generated this pickle. Which one comes last is not guaranteed, so we look up against
        // every id and take whichever one actually resolves, rather than assuming position.
        //
        // dataTable is read from the pickle step's OWN argument, not looked up via astNodeIds
        // against the raw AST: the AST only has the source step's literal table (placeholders
        // like `<status>` unresolved), while the pickle's argument is what `compile()` already
        // substituted against this specific Examples row.
        steps: pickle.steps.map(s => ({
          text: s.text,
          keyword: (s.astNodeIds && s.astNodeIds.map((id) => stepKeywords[id]).find((k) => k)) || '',
          dataTable: s.argument?.dataTable
            ? s.argument.dataTable.rows!.map((row: any) => row.cells!.map((cell: any) => cell.value))
            : null,
        })),
      });
    }
  }
  return scenarios;
}
