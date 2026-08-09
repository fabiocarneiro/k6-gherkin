Feature: NoTable

  Scenario Outline: parameterized step without a data table
    Given a step with <value>
    Then it should not crash

    Examples:
      | value |
      | X     |
      | Y     |
