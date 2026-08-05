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
