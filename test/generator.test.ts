import { describe, expect, it } from 'vitest';
import * as path from 'path';
import { discoverStepImports, generateScript } from '../src/generator';

const fixture = (name: string) => path.join(__dirname, 'fixtures', name);

describe('generateScript — step registration contract', () => {
  // Step files can't import k6-gherkin's own registry at runtime: k6 only resolves
  // relative/absolute file paths, never bare node_modules specifiers, and this package's own
  // dist/index.js barrel has extension-less internal requires k6 can't follow either way. So
  // the generated script must own a single shared registry and inject Given/When/Then/And/But
  // into each step file's default-export factory — never expect a step file to import or build
  // its own registry.
  it('builds one shared registry via an absolute path to this package\'s own step-registry.js', () => {
    const script = generateScript([], {}, {});

    expect(script).toMatch(/import \{ createRegistry \} from '.*step-registry\.js';/);
    expect(script).toContain(
      'const { Given, When, Then, And, But, steps: allStepDefs } = createRegistry();'
    );
  });

  it('imports each discovered step file\'s default export and calls it with the shared registry', () => {
    const stepsDir = fixture('steps');
    const [{ exportName }] = discoverStepImports(stepsDir);

    const script = generateScript([], {}, { stepsDir });

    expect(script).toContain(`import ${exportName} from '${path.join(stepsDir, 'sample-steps.ts')}';`);
    expect(script).toContain(`${exportName}(Given, When, Then, And, But);`);
    // No array-spread of a `.steps`/default-export fallback chain — that was the old
    // (pre-injection) contract, where each step file built its own registry.
    expect(script).not.toContain('.steps ||');
    expect(script).not.toMatch(/\.\.\.\w+Steps\b/);
  });
});
