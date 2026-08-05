#!/usr/bin/env node
'use strict';

const path = require('path');
const { runK6 } = require('../src/runner');

const featuresDir = process.argv[2] || path.join(process.cwd(), 'features');
const stepsDir = process.argv[3] || path.join(process.cwd(), 'steps');

runK6({
  featuresDir,
  stepsDir,
});
