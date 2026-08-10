Feature: Rule support

  Rule: widgets require a clean database

    Background:
      Given a clean database

    Scenario: a scenario nested under a rule
      Given a widget named "Sprocket"
      When the rule's steps are parsed
      Then the step keyword should not be empty
