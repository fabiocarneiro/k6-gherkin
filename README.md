# k6-gherkin

> Gherkin BDD test runner and summary reporter for Grafana k6.

`k6-gherkin` allows you to write living business specifications using standard **Gherkin** (`.feature` files) and execute them natively inside **k6** using your own custom JavaScript or TypeScript step definitions.

---

## Why does this exist?

> **TL;DR:** One spec, two jobs—prove it works, then prove it holds up under load, plain enough for the team, precise enough to check an LLM's work against.

<details>
<summary>The longer version</summary>

Selenium, Cypress, Playwright, and others are good at what they're built for: driving a real browser through a user flow and asserting on what happens. Performance testing isn't that job—there's no clean way to parameterize virtual users or ramping stages, and their reporting is built around one run's pass/fail rather than latency and throughput over time. Macro-recording tools like JMeter take the opposite angle and cover the load side, and module controllers or parameterization can make a recording reusable—but the test plan itself stays opaque outside the team that wrote it. A product owner or domain expert can't open it and tell what user behavior it's actually exercising.

Realistic load isn't one endpoint hit as hard as possible—it's the paths real users take through the app, at scale, described in a shared language engineers and the people who define "correct" behavior can both read and agree on. A Gherkin scenario captures that path as behavior, kept separate from both how it's automated (the step definitions) and how much load sits behind it (virtual users, ramp-up strategy). Write "user adds an item to their cart" once, reuse the same steps across scenarios, and change the load profile without touching the behavior being tested.

That's also why this package ships no premade step vocabulary—none of the `Given path '/users'`, `When method post`, `Then status 200` steps that tools like Karate bundle in. That vocabulary saves a few minutes of writing step definitions, but the price is a `.feature` file that reads like an HTTP client's log instead of the business behavior it's meant to describe—the exact distance Gherkin exists to close. That trade made more sense when hand-writing step definitions was the expensive part. It doesn't anymore: an LLM turns "the user adds an item to their cart" into the HTTP call behind it just as easily as it recalls someone else's REST-flavored keywords, so the convenience premade steps offered mostly evaporates while the cost—domain language diluted into protocol language, plus a vocabulary to remember—stays. `k6-gherkin` ships zero built-in steps on purpose: you write them, in your domain's words.

k6 was built for performance testing first, with scriptable load profiles and reporting that actually answers "how does this behave under load?" A functional check is just a load test with one virtual user, so it's a solid foundation for functional checks too. What it lacked was Gherkin—no native way to run `.feature` files—and that's the piece this fills: write scenarios in plain Gherkin, back them with step definitions in JS/TS, and run the same spec as a functional check or a full load test, with k6's native reporting either way. The goal is for this to be a one-stop shop for testing—functional and performance, in the same suite, described in language plain enough for the whole team to read, not just the engineers who automate it. That same plainness is what makes `.feature` files useful for reviewing AI-written code: narrow and executable enough to read as the spec, run it, and see whether an LLM's implementation actually does what it claims—rather than having to read the implementation to find out.

That ambition doesn't reach UI testing yet. k6 Studio can record a flow the way JMeter does and generate a script from it—a fine seed for a Gherkin scenario—but neither it nor k6's own browser module (Chromium over CDP) has caught up to the cross-browser coverage or debugging tooling Cypress and Playwright already offer. A real limitation of this approach today, worth saying outright rather than glossing over.

</details>

---

## Key Features

- **True BDD Separation**: Write technology-agnostic `.feature` files in pure business language.
- **No Built-in HTTP Steps**: Ships zero premade `Given path '/users'`-style vocabulary—steps stay in your domain's language, not the protocol's.
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
✓ threshold: checks rate == 1
```

---

## License

[MIT](LICENSE)
