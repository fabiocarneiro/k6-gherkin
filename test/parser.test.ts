import { describe, expect, it } from 'vitest';
import * as path from 'path';
import { parseFeatures } from '../src/parser';

const fixture = (name: string) => path.join(__dirname, 'fixtures', name);

describe('parseFeatures — Scenario Outline keyword/dataTable regression', () => {
  // Before the fix in v0.0.25, a pickle step's astNodeIds were indexed by
  // position (`astNodeIds[astNodeIds.length - 1]`), which happened to work for
  // a plain Scenario (one id) but not a Scenario Outline (two ids: the step's
  // own id and the Examples row's id — order not guaranteed). This silently
  // dropped `keyword` (`''`) and `dataTable` (`null`) for every outline step.
  it('resolves keyword and dataTable per Examples row for a Scenario Outline step', () => {
    const scenarios = parseFeatures(fixture('outline-with-table.feature'));

    expect(scenarios).toHaveLength(2);

    const [alpha, beta] = scenarios;
    expect(alpha.name).toBe('parameterized step with a data table');
    expect(alpha.steps[0].keyword).toBe('Given');
    expect(alpha.steps[0].dataTable).toEqual([
      ['key', 'value'],
      ['a', 'Alpha'],
    ]);

    expect(beta.steps[0].keyword).toBe('Given');
    expect(beta.steps[0].dataTable).toEqual([
      ['key', 'value'],
      ['a', 'Beta'],
    ]);
  });

  // Locks in the case that already worked, so a future "simplification" of the
  // astNodeIds lookup can't reintroduce the outline bug from the other side.
  it('still resolves keyword and dataTable for a plain (non-outline) Scenario step', () => {
    const [scenario] = parseFeatures(fixture('plain-with-table.feature'));

    expect(scenario.steps[0].keyword).toBe('Given');
    expect(scenario.steps[0].dataTable).toEqual([
      ['key', 'value'],
      ['a', 'fixed'],
    ]);
  });

  // A Scenario Outline step with no data table must still resolve its keyword
  // (two astNodeIds to search) and leave dataTable as null, not throw.
  it('resolves keyword and leaves dataTable null for a Scenario Outline step with no table', () => {
    const scenarios = parseFeatures(fixture('outline-without-table.feature'));

    expect(scenarios).toHaveLength(2);
    for (const scenario of scenarios) {
      expect(scenario.steps[0].keyword).toBe('Given');
      expect(scenario.steps[0].dataTable).toBeNull();
    }
  });
});

describe('parseFeatures — Background and step conjunctions', () => {
  // Background steps are prepended to every scenario's pickle, and And/But
  // steps keep their own literal keyword (not resolved to the Given/When/Then
  // they inherit from) - all of them need to resolve via the same
  // astNodeIds -> stepKeywords lookup as a plain step.
  it('resolves keywords for Background, And, and But steps alongside the scenario', () => {
    const [scenario] = parseFeatures(fixture('background.feature'));

    expect(scenario.steps.map(s => s.keyword)).toEqual([
      'Given', // Background: a clean database
      'And',   // Background: a seeded admin user
      'Given', // the admin is logged in
      'When',  // they create a widget
      'Then',  // the widget should exist
      'But',   // the widget should not be published
    ]);
  });
});

describe('parseFeatures — Rule blocks', () => {
  // Before this fix, stepKeywords was only built from `child.scenario` and
  // `child.background` at the top level of feature.children - a Rule's own
  // children live one level deeper, under `child.rule.children`, so every
  // step nested in a `Rule:` block never got indexed and silently resolved
  // to keyword: ''.
  it('resolves keywords for Background and Scenario steps nested under a Rule', () => {
    const [scenario] = parseFeatures(fixture('rule.feature'));

    expect(scenario.steps.map(s => s.keyword)).toEqual([
      'Given', // Rule > Background: a clean database
      'Given', // a widget named "Sprocket"
      'When',  // the rule's steps are parsed
      'Then',  // the step keyword should not be empty
    ]);
  });
});
