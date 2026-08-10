import type { Given, When, Then } from '../../../src/step-registry';

export default function (Given: Given, When: When, Then: Then) {
  Given(/^a thing$/, () => {});
}
