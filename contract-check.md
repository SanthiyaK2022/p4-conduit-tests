# My schema, auth and contract checks (week 4, project P4)

The coach fills this in from your answers. Check that every line is what you saw and decided.

App: Conduit practice app on my laptop · Date: 2026-11-17

## 1. My first look
How I would check that an article answer has the right shape: the test should check that response has an article object of title, taglist, favorited, ect

## 2. Practice: the key list check
File: `P4/materials/contract-example.spec.ts` (the sign-up answer).
Three changes: `bio` is missing · a new field `password` is added · `token` becomes a number.
- **The toMatchObject check (worked example):** missing: passes · new field: passes · number: fails
- **The key list check (my answer):** Missing bio is fail due to expected key value is missing, new field also fail because this is an additional key unaware of it, number get pass becuase it just compares the names instead of value

## 3. My prompt for Claude
```text
Task: Write Playwright API tests in P4/tests/contract.spec.ts. Schema checks: the answers of GET /api/articles/:slug and GET /api/user have the shape that API.md gives, checked with toMatchObject and expect.any. Auth tests: no token, a wrong token, and changing someone else's article. After the file, write one line per test: what it checks.
Material: @P4/API.md @P4/tests/example.spec.ts Send requests with the request fixture, like this example.
Rules: Write the tests from API.md only. Do not read the app's code in P4/app. Do not run the tests. Check all the field names and their data types against the given API.md and also check their objects
```

## 4. Claude's tests and my run
- **Run:** `npx playwright test tests/contract.spec.ts` · **Result:** 5 passed, 0 failed
- **A red test, and who was wrong:** No test failed.

## 5. The teammate's question
- **Claude's test:** "GET /api/articles/:slug answers with the Article shape from API.md"
- **Claude said:** "Status 200. `toMatchObject` checks the `article` object has all 10 fields and their types. It also checks the `author` object (a Profile with no wrapper) and that every `tagList` item is text."
- **My answer:** No, this would still pass because it will check the exact match using toMatchObject even if any extra fields are there, to validate this, we need to give a exact check list including to validate if there is any extra fields

## 6. My change
- **What I asked Claude:** "In @P4/tests/contract.spec.ts, the article shape test missing if any extra fields, so add this check based API.md including the fields inside the objects.Do not run the test"
- **The run after it:** 5 passed, 0 failed

## 7. Proof: the contract test fails when the answer changes
- **My prediction before the run:** test 1 fails because it removes the field from response and test checks all fields present in API.md
- **Run with the practice fault F2 on:** `$env:CONDUIT_FAULT = "F2"`, then `npx playwright test tests/contract.spec.ts` · **Result:** 4 passed, 1 failed ("GET /api/articles/:slug answers with the Article shape from API.md")
- **What Playwright showed:** `-     "body": Any<String>,` under `- Expected  - 1` / `+ Received  + 0`, at the toMatchObject check (line 52)
- **My answer about a red test:** field name is body which is expected, but missing
- **Run with the fault off again:** `$env:CONDUIT_FAULT = ""`, then the same run · **Result:** 5 passed, 0 failed
