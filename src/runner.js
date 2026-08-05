const { spawn } = require('child_process');
const path = require('path');
const { parseFeatures } = require('./parser');
const { generateScript } = require('./generator');

function runK6(options = {}) {
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

  k6.on('error', (err) => {
    console.error('[k6-gherkin] Failed to start k6:', err.message);
    process.exit(1);
  });

  k6.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

module.exports = { runK6 };
