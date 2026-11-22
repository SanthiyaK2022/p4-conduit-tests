# My CI workflow and review (week 4, project P4)

The coach fills this in from your answers. Check that every line is what you saw and decided.

Repository: the P4 folder · Workflow: `.github/workflows/playwright.yml` · Date: 2026-11-23

## 1. What my project needs
- **Node.js on my laptop (`node -v`):** v22.15.0
- **My whole suite on my laptop:** `npx playwright test` → 22 passed, 0 failed
- **What the GitHub computer needs (my words):**
  - Node.js: The github should use node.js matching my laptop and meeting project's requirement.
  - Packages: Use npm ci because that install all packages version from package-lock.json
  - Browser: Chromium only (from the example)

## 2. My prompt to Claude
```text
Task: Write a GitHub Actions workflow that runs this Playwright suite on every push and keeps the HTML report. My GitHub repository is the P4 folder, so save it as P4/.github/workflows/playwright.yml. After the file, write one line for each step: what it does.
Material: @P4/package.json @P4/playwright.config.ts @P4/README.md
Rules: Use actions/checkout@v6, actions/setup-node@v6 and actions/upload-artifact@v6. Do not run anything. Do not commit or push. Use node.js, install packages with npm ci, and install chromium wit it's required dependencies before runing the test.
```

## 3. What Claude's workflow got wrong for my project
- **Claude's workflow:** line 16, `node-version: 22`
- **Claude said:** "ASSUMPTION: I used `node-version: 22`. Your material only says `"node": ">=22.13"` (package.json line 7). Version 22 gets the newest 22.x release, which meets that."
- **My project needs:** Node.js matching my laptop: v22.15.0
- **My answer to the developer:** Before merging use node version: "22.15.0" instead of 22 to match my laptop exactly.
- **My line to Claude:** In @P4/.github/workflows/playwright.yml, change line 16 from node-version: 22 to node-version: '22.15.0', because my laptop passed all 22 tests on v22.15.0. Change nothing else. Do not run anything.

## 4. My reading of the workflow
- **When, where, the code and Node.js (lines 1–16):** This workflow runs every push to any branch and it uses fresh ubuntu linux computer in github and copies project code on it, and sets up the node.js to match my laptop.
- **Packages, browser, tests and the report (lines 17–32):** npm ci installs the exact packages, and it runs the playwright tests. And it uploads the playwright-report. The if: line: this step if:${{always()}} uploads test report even the test fails so still we can read the file and investigate

## 5. The first run on GitHub
- **Run:** Add the CI workflow · **Result:** green tick · **Tests:** 22 passed
- **The report (artifact):** yes, playwright-report is under Artifacts

## 6. A red run on purpose
- **The change:** `tests/example.spec.ts` line 6, `toBe(200)` → `toBe(201)`
- **My prediction:** The run the playwright turn red because expected is 201 but received is 200
- **What GitHub showed:** expected is 201, received is 200

## 7. Fixed, and green again
- **The fix:** line 6 back to `toBe(200)` · **Run:** Fix the expected status · **Result:** 22 passed

## 8. Review notes for my other AI-written tests (written while CI ran)
The API checklist: status · body · shape · negative cases (a refused request changes nothing) · own test data.
Monday's and Tuesday's tests that I did not review in depth on those days. Each one: kept, changed or removed, and why.

### Monday: `tests/api.spec.ts`
- "create an article returns 201 and the full Article": **changed**, because add a GET after creating the article
- "read an article by slug returns 200 and the same Article": **kept**, because it reads the article and checks it's details
- "delete an article returns 204 with no body, and the article is gone": **kept**, because it checks 204 with no body
- "create an article without a token returns 401 token is missing": **changed**, because confrim no article was saved
- "update someone else's article returns 403 forbidden and does not change it": **kept**, because it reads again and confirm no description changes
- "delete an article with a wrong token returns 401 token is invalid": **kept**, because it confirms the article still exists after deletion
- "read an article that does not exist returns 404 article not found": **kept**, because it checks 404

### Tuesday: `tests/contract.spec.ts`
- "GET /api/user answers with the User shape from API.md": **changed**, because add an exact field name check from API. Extra field still passes because the the toMatchObject allows additional fields. missing field failes if it is included in the expected object
- "GET /api/user with no token returns 401 token is missing": **kept**, because it checks 401 and correct the error when no token is sent
- "GET /api/user with a wrong token returns 401 token is invalid": **kept**, because correct error when wrong token sent
- "changing someone else's article returns 403 forbidden and does not change it": **kept**, because 403 reads again to check description is not changed
