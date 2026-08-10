Feature: Background and step conjunctions

  Background:
    Given a clean database
    And a seeded admin user

  Scenario: create a widget
    Given the admin is logged in
    When they create a widget named "Sprocket"
    Then the widget "Sprocket" should exist
    But the widget "Sprocket" should not be published
