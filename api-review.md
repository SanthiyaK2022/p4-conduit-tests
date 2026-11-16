# API review: Claude's first API tests (week 4, project P4)

The coach fills this in from your answers. Check that every line is what you decided and what you saw.

- **App:** Conduit, the practice app on your own laptop (`http://127.0.0.1:3000`)
- **API description:** `P4/API.md`
- **Test file:** `P4/tests/api.spec.ts`, written by Claude
- **Prompt file:** `P4/prompts/api.md`

## 1. My first look, by hand
The request my comment sent in the app, and the status that came back.
- Request method: POST, and status code is 201 created

## 2. My predictions and the real answers
One line per request: what I predicted, and what the app really answered.
- **A** (a comment, with the token): I predicted 201, creates a comment. The app answered 201, with the comment "Clear and useful." by practice-reader.
- **B** (the same comment, with no token): I predicted 401, has no token. The app answered 401, errors: token is missing.
- **C** (a comment on an article that does not exist): I predicted 404, refers to article. The app answered 404, errors: article not found.
- **The answer that surprised me most:** The C 404 returned becuase the page is not found

## 3. My prompt to Claude
```text
Task: Write at least 6 Playwright API tests for articles in the Conduit API: create, read, change and delete an article. At least 3 positive and at least 3 negative tests. Save them in P4/tests/api.spec.ts. After the file, write one line per test: what it checks.
Material: @P4/API.md @P4/tests/example.spec.ts Send requests with the request fixture, like this example.
Rules: Write the tests from API.md only. Do not read the app's code in P4/app. Do not run the tests. Don't check just status, check both status and the response agains the API.md file, including both positvie or negative code/response or error message.
```

## 4. The run
- **Result:** 10 passed, 0 failed.
- **A red test, and who is wrong:** No test failed.
- **My note:** No test failed.

## 5. The developer's question
The test I looked at, and my answer to: "So the app saved nothing, right?"
- **Test:** "create an article without a title returns 422 title can't be blank" (lines 140–145)
- **My answer:** The test only checks the status code and error message and but didn't confirm whether the article was saved, so we need to check and confirm that it was not created.

## 6. Tests I reviewed with the API checklist
The API checklist: status · body · shape · negative cases (a refused request changes nothing) · own test data.

### "update an article changes only the fields sent and changes the slug when the title changes" (lines 86–112)
- **My decision:** After adding a changes by PUT, we are not sure whether it got changed, so use GET methoed to verify that

### "update with tagList null returns 422 with a tagList error" (lines 164–179)
- **My decision:** Change the test, because the error response doesn't alone confirm that the original tag stayed

## 7. My API rules
The rules I added to my `playwright-quality` skill, under `## API rules`:
1. Check the status code and request against the API.md
2. after creating or updating any value, use GET to check whether it is saved
3. If remove anything, again use GET to check that it was removed properly
