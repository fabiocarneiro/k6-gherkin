Feature: Example

  Scenario Outline: parameterized step with a data table
    Given a table step with:
      | key | value    |
      | a   | <status> |
    Then it should not crash

    Examples:
      | status |
      | Alpha  |
      | Beta   |
