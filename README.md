# k6-gherkin

> Unopinionated Gherkin BDD test runner and summary reporter for Grafana k6.

`k6-gherkin` allows you to write living business specifications using standard **Gherkin** (`.feature` files) and execute them natively inside **k6** using your own custom JavaScript or TypeScript step definitions.

---

## Key Features

- **True BDD Separation**: Write technology-agnostic `.feature` files in pure business language.
- **Custom Step Definitions**: Register custom step matching functions using `Given`, `When`, `Then`, `And`, `But`.
- **Protocol & Backend Agnostic**: Test gRPC, REST/HTTP, WebSockets, or GraphQL services.
- **Native k6 Reporting**: Integrated `handleSummary` reporter formats test checks into a BDD hierarchy (`Feature` → `Scenario` → `✓ Step`).
- **Zero Go Compilation**: Pure JavaScript/TypeScript adapter—runs with standard `k6` without needing `xk6` or custom binaries.

---

## Installation

```bash
npm install k6-gherkin
```

---

## Usage Example

### 1. Define your Feature (`features/portfolio.feature`)

```gherkin
Feature: Portfolio Management
  Scenario: Create portfolio and record transaction
    Given a signed-in user
    When the user creates a portfolio named "Long Term Tech"
    Then the portfolio should appear in the portfolio list
```

### 2. Write Step Definitions (`steps/portfolio-steps.ts`)

```typescript
import { createRegistry, StepContext } from 'k6-gherkin';

const { Given, When, Then, steps } = createRegistry();

Given(/^a signed-in user$/, async (ctx: StepContext) => {
  ctx.idToken = 'mock-user-token';
});

When(/^the user creates a portfolio named "([^"]+)"$/, async (ctx: StepContext, name: string) => {
  // Execute API or gRPC request with k6
  ctx.portfolioName = name;
});

Then(/^the portfolio should appear in the portfolio list$/, async (ctx: StepContext) => {
  ctx.check(ctx.portfolioName, {
    'portfolio exists': (val) => val === 'Long Term Tech',
  });
});

export default steps;
```

### 3. Run with `k6-gherkin`

```javascript
const { runK6 } = require('k6-gherkin');

runK6({
  featuresDir: './features',
  stepsDir: './steps',
});
```

---

## Summary Output

When executed, k6 check results are formatted directly in the console output:

```text
Feature: Portfolio Management

  Scenario: Create portfolio and record transaction
    ✓ Given a signed-in user
    ✓ When the user creates a portfolio named "Long Term Tech"
    ✓ Then the portfolio should appear in the portfolio list

────────────────────────────────────────────────────────────
✓ 3 checks: 3 passed
✓ threshold: checks rate > 0.98
```

---

## License

[MIT](LICENSE)
