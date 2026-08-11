# k6-gherkin

> Unopinionated Gherkin BDD test runner and summary reporter for Grafana k6.

`k6-gherkin` allows you to write living business specifications using standard **Gherkin** (`.feature` files) and execute them natively inside **k6** using your own custom JavaScript or TypeScript step definitions.

---

## Why does this exist?

E2E tools like Selenium, Cypress, Playwright, and others are built to drive a single browser session, not to generate load—there's no clean way to parameterize virtual users or ramping stages, and their reporting is built for one run's pass/fail rather than latency and throughput over time. Macro-recording tools like JMeter get closer, since a recorded flow already looks like something a real user did, but every flow becomes its own script: test five similar journeys and you maintain five recordings with no shared vocabulary between them, each drifting out of sync in its own way.

That's the part Gherkin actually solves. Realistic load isn't hitting one endpoint as hard as possible—it's reproducing the paths real users take through the app, at scale. A Gherkin scenario describes that path as behavior, kept separate from both how it's automated (the step definitions) and how much load sits behind it (virtual users, ramp-up strategy). Write "user adds an item to their cart" once, reuse the same steps across scenarios, and change the load profile without touching the behavior being tested—something a one-off recording or script doesn't give you.

k6 was built for performance testing first, with scriptable load profiles and reporting that actually answers "how does this behave under load?" A functional check is just a load test with one virtual user, so it's a solid foundation for e2e testing too—it just had no native way to run `.feature` files.

That missing piece is what this fills: write scenarios in plain Gherkin, back them with step definitions in JS/TS, and run the same spec as a functional check or a full load test, with k6's native reporting either way. The result is a single tool for both performance and behavior testing, where `.feature` files double as living documentation—plain enough for the whole team to read, not just the engineers who automate it, and structured enough for AI tools to generate, extend, or reason over just as easily.

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
import type { Given, When, Then, StepContext } from 'k6-gherkin';

// A step file exports one factory function; k6-gherkin calls it with a Given/When/Then/And/But
// shared across all step files in stepsDir. Nothing is imported from 'k6-gherkin' at runtime —
// only `import type`, which is erased before k6 ever tries to resolve it — so step files have
// zero runtime dependency on this package, matching k6's own module loader (relative/absolute
// file paths and remote URLs only, no node_modules resolution).
export default function (Given: Given, When: When, Then: Then) {
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
}
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
