import { spawn } from 'child_process';
import * as path from 'path';
import { parseFeatures } from './parser';
import { generateScript, GeneratorOptions } from './generator';

export interface RunK6Options extends GeneratorOptions {
  featuresDir?: string;
  resources?: Record<string, unknown[]>;
  k6Args?: string[];
  cwd?: string;
}

export function runK6(options: RunK6Options = {}): void {
  const featuresDir = options.featuresDir ? path.resolve(options.featuresDir) : path.resolve(process.cwd(), 'features');
  const scenarios = parseFeatures(featuresDir);
  const resources = options.resources || {};

  console.error(`[k6-gherkin] Loaded ${scenarios.length} scenario(s) from ${featuresDir}`);

  const script = generateScript(scenarios, resources, options);

  const k6Args = options.k6Args || ['run', '--iterations', '1', '--duration', '30m', '-'];
  const k6 = spawn('k6', k6Args, {
    stdio: ['pipe', 'inherit', 'inherit'],
    cwd: options.cwd || process.cwd(),
  });

  k6.stdin.write(script);
  k6.stdin.end();

  k6.on('error', (err: Error) => {
    console.error('[k6-gherkin] Failed to start k6:', err.message);
    process.exit(1);
  });

  k6.on('exit', (code: number | null) => {
    process.exit(code ?? 0);
  });
}
