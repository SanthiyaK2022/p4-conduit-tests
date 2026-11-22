# My practice fault report (week 4, project P4)

App: Conduit practice app on my laptop · Practice faults: `P4/faults/practice.json` (F1 to F6) · Date: 2026-11-22
**How to read it:** a "detect" fault is **caught** when at least one test that passed with no fault fails with it, and **missed** when every test still passes. A "robust" fault (the app is only slower) should **stay green**; if tests fail, it **went red**.

## 1. My guess this morning
- **The developer asked:** "Your suite is green. How many real problems would it catch?"
- **My answer:** We can't tell beacuse of 18 tests passed, we need to run the suit to see which problem makes the test fail

## 2. Before: my suite against the practice faults
- **Command:** `node materials/faults-run.mjs` (TESTS terminal, in `P4`, with no app running)
- **My test files:** `api.spec.ts`, `contract.spec.ts`, `e2e.spec.ts`, `example.spec.ts`, `profile-follow/follow-persists.spec.ts`, `profile-follow/signed-out.spec.ts`, `seed.spec.ts`
- **No fault:** 21 passed, 0 failed
- **F1** (Opening an article gives a server error (500)): caught (9 tests failed)
- **F2** (The article answer has no body text): caught (3 tests failed)
- **F3** (The article answer has a different title): caught (2 tests failed)
- **F4** (The comments list is always empty): caught (1 test failed: e2e.spec.ts › a signed-in user posts a comment on an article)
- **F5** (The article answer comes 3 seconds late): stayed green (0 tests failed)
- **F6** (Posting a comment is refused (422) and nothing is saved): caught (1 test failed: e2e.spec.ts › a signed-in user posts a comment on an article)

## 3. The weak spot I chose, and why
My suit is weekest around comments, f4 where the comments list is empty

## 4. How I made the suite stronger
- **My request for Claude** (the New tests line of `P4/prompts/stronger.md`): Only one test checks comment, add API test and check the post comments returns code status and check get comment that list is saved
- **New or changed test file:** `tests/comments-api.spec.ts` (new), `tests/profile-follow/follow-persists.spec.ts` (changed)

## 5. After: the run again
- **Command:** `node materials/faults-run.mjs F4`
- **No fault:** 22 passed, 0 failed
- **The fault I chose:** F4 (The comments list is always empty): caught (2 tests failed: comments-api.spec.ts › POST a comment returns 201, and GET comments lists the saved comment; e2e.spec.ts › a signed-in user posts a comment on an article)

## 6. What changed
Now we have evidence, the test shows with coverage but doesn't prove that catch every problem. Before the test catch only empty comments list problem.now 2 tests catch it and 22 test pass when fault is off
