Feature: The application is ascessible

   In order to stream reactions to some comments

    Scenario: Check the app working
        Given the sample app is started "{port: 8666, maxBufferLength:4}"
        When I navigate the browser to "http://localhost:8666"
        And I wait 2 seconds
        Then I see 4 questions
