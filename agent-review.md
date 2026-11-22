# Tests from Playwright's agents, and my review (week 4, project P4)

App: Conduit practice app on my laptop · Date: 2026-11-22

## 1. How I set up the agents
- **Command:** `npx playwright init-agents --loop=claude` (TESTS terminal, in `P4`)
- **What it made:** `.claude/agents/playwright-test-planner.md`, `.claude/agents/playwright-test-generator.md`, `.claude/agents/playwright-test-healer.md`, `.mcp.json`, `specs/README.md`, `tests/seed.spec.ts`
- **Browser hidden:** `"--headless"` added to `P4/.mcp.json`: yes
- **Where I started Claude for the agents:** in `P4`, because Claude finds the agents and their browser only there

## 2. What I asked the agents
- **Area:** the profile page and following an author
- **My prompt** (`P4/prompts/agents.md`):
  - Task: First use the playwright-test-planner agent to plan tests for the profile page and following an author. Save the plan as specs/profile-follow.md. Then use the playwright-test-generator agent to write one test for each scenario in the plan, in the folder tests/profile-follow/.
  - Material: Start on the page /profile/practice-author. For steps that need a signed-in user, use a practice user from README.md.
  - Rules: Plan at most 2 short scenarios, with at most 5 steps each. Do not change any other test file. Do not run the test suite. After following author, reload the page and check still it shows "unfollow" for the same author.
- **The plan the planner saved:** `specs/profile-follow.md`
- **The test files the generator wrote:** `tests/profile-follow/follow-persists.spec.ts`, `tests/profile-follow/signed-out.spec.ts`
- `tests/seed.spec.ts` is the agents' start file. It checks nothing about the app, so it is not reviewed here.

## 3. My review of every generated test
- **The teammate's question:** "Claude says the test unfollows first when needed, so it sets its own start. So we can keep this test in our suite as it is, right?"
- **My answer:** We should change it because it keeps the starting state and when new user it still uses the practice users. So use a new user for each test and remove the follow, so the tests are not affected.
- "Follow persists after reload" · **changed**, because it checks the following still works after reload but it also changes the shared practice's status, it should create a own user to cleanup
- "Signed-out visitor cannot follow" · **kept**, because I kept this test because it checks that a signed out visitor sees both article tabs but no follow or unfollow buttons, without changing any shared data

## 4. What I asked Claude to change, and the result
- **My change** (the Changes line of `P4/prompts/stronger.md`): In @P4/tests/profile-follow/follow-persists.spec.ts: changed, it checks the following still works after reload but it also changes the shared practice's status, it should create a own user to cleanup.
- **Result:** No fault: 22 passed, 0 failed (the "No fault" line of my second fault run)
