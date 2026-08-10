# k6-gherkin

> Unopinionated Gherkin BDD test runner and summary reporter for Grafana k6.

`k6-gherkin` allows you to write living business specifications using standard **Gherkin** (`.feature` files) and execute them natively inside **k6** using your own custom JavaScript or TypeScript step definitions.

---

## Why does this exist?

Most end-to-end tools double as load testers only on paper. Selenium, Cypress, and Playwright are built around driving a single browser session, so once you try to point them at load or performance testing, you hit the same walls: no clean way to parameterize virtual users, ramping stages, or thresholds, and reporting that's designed around one run's pass/fail rather than latency percentiles and throughput over time.

k6 solves that from the other direction—it's built for performance testing first, with scriptable load profiles and reporting that actually answers "how does this behave under load?" That makes it a reasonable foundation for functional/e2e checks too, since a check is just a load test with one VU. The gap was Gherkin: k6 has no native way to run `.feature` files, and Gherkin is worth keeping around because it reads equally well to a non-technical stakeholder and to a test runner—one spec, two audiences, no translation layer.

`k6-gherkin` fills that gap. Write your scenarios in plain Gherkin, back them with step definitions in JS/TS, and run the same spec as a functional smoke test or a full load test, with k6's native reporting either way.

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

### 1. Define your Feature (`features/shopping-cart.feature`)

```gherkin
Feature: Shopping Cart
  Scenario: Add item to cart
    Given an authenticated user
    When the user adds "Wireless Headphones" to their shopping cart
    Then the shopping cart should contain 1 item
```

### 2. Write Step Definitions (`steps/cart-steps.ts`)

```typescript
import { createRegistry, StepContext } from 'k6-gherkin';

const { Given, When, Then, steps } = createRegistry();

Given(/^an authenticated user$/, async (ctx: StepContext) => {
  ctx.userToken = 'auth-token-123';
});

When(/^the user adds "([^"]+)" to their shopping cart$/, async (ctx: StepContext, item: string) => {
  // Execute HTTP or gRPC request using k6
  ctx.cartItems = [item];
});

Then(/^the shopping cart should contain 1 item$/, async (ctx: StepContext) => {
  ctx.check(ctx.cartItems, {
    'cart has item': (items) => items && items.length === 1,
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
Feature: Shopping Cart

  Scenario: Add item to cart
    ✓ Given an authenticated user
    ✓ When the user adds "Wireless Headphones" to their shopping cart
    ✓ Then the shopping cart should contain 1 item

────────────────────────────────────────────────────────────
✓ 3 checks: 3 passed
✓ threshold: checks rate > 0.98
```

---

## License

[MIT](LICENSE)
