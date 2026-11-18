# My end-to-end tests and review (week 4, project P4)

App: Conduit practice app · Test file: `P4/tests/e2e.spec.ts` · Date: 2026-11-18

## 1. My first look
- **After I published an article by hand, I would check:** I will check the confirmation status for publishing and check whether it reflects on the global feed with verifying all the details that match with what I entered
- **Where the page keeps my sign-in:** jwtToken

## 2. Practice
- **Worked example (the like test):** it signs in through the form as a practice user, so other tests can change its data.
- **Does its check at the end prove the journey?** No, the line 19 checks the article is visible before clicking the favourite, so we need to check this by API that aritcle is marked as favourite to confirm

## 3. My prompt
```text
Task: Write 2 end-to-end tests in P4/tests/e2e.spec.ts. Test 1: a signed-in user publishes a new article in the editor. Test 2: a signed-in user posts a comment on an article. Make a new user with the API, give the page its token, do the journey in the page, and check the result with the API at the end. After the file, write one line per test: what it checks.
Material: @P4/API.md @P4/app/public/app.js app.js is the page's code: take the labels and button names from it. The page keeps the sign-in token in localStorage, key jwtToken.
Rules: Use app.js only for the labels and button names. Do not change the app. Do not run the tests. After publishing the article, need to cross check with API that posted is match with what I entered
```

## 4. The run
- **Claude's 2 tests:** 2 passed, 0 failed.

## 5. The teammate's question
- **Claude said:** "Test 1, publish an article: a new user made with the API, signed in by putting the token in localStorage under jwtToken" / "Test 2, post a comment: a new user and an article are made with the API." Later in its answer: "What the tests leave behind: I added no clean-up. Each run leaves new users, articles and comments in the app."
- **My answer:** No, the test creates it's own data and not deleted afterward, so it is still present after the run

## 6. What I saw on the home page
- I could see these details in E2E: "E2E comment target 1795022362430" and "E2E article 1795022361756" in the Global Feed.

## 7. My change
- **My line to Claude:** In @P4/tests/e2e.spec.ts. delete the article and comments created by each test using the API in test.AfterEach, so cleanup runs even the chck fails. Do not run the test.
- **The clean-up Claude added:** each test saves its user and article right after it makes them; test.afterEach deletes that user's comments on the article, then the article, with the API.

## 8. Proof
- **Each test twice, on an app that keeps its data:** `npx playwright test tests/e2e.spec.ts --repeat-each=2` → 4 passed, 0 failed
- **The newest article on the home page after the run:** Your first end-to-end test
