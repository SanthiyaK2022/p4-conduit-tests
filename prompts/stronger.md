Changes: In @P4/tests/profile-follow/follow-persists.spec.ts: changed, it checks the following still works after reload but it also changes the shared practice's status, it should create a own user to cleanup.
New tests: Only one test checks comment, add API test and check the post comments returns code status and check get comment that list is saved
Material: @P4/API.md @P4/tests/e2e.spec.ts Make users and data by API, and clean up, like these tests.
Rules: Write the tests from API.md only. Do not read the app's code in P4/app. Change nothing else. Do not run the tests.
