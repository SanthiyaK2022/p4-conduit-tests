// spec: specs/plan.md
// seed: tests/seed.spec.ts
import { test, expect, APIRequestContext } from '@playwright/test';

// The test makes its own reader and author with the API, so it does not change the shared practice users.
// API rules come from P4/API.md.

type User = { username: string; email: string; password: string; token: string };

// API.md "Users and sign-in": POST /api/users -> 201 User. Password needs at least 8 characters.
async function signUp(request: APIRequestContext, name: string): Promise<User> {
  const unique = `${name}${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `${unique}@example.com`;
  const password = 'password123';
  const response = await request.post('/api/users', {
    data: { user: { username: unique, email, password } },
  });
  expect(response.status()).toBe(201);
  const json = await response.json();
  return { username: json.user.username, email, password, token: json.user.token };
}

function auth(token: string) {
  return { Authorization: `Token ${token}` }; // API.md "Basics"
}

// What the test made, so afterEach can undo the follow even when a check fails.
let created: { reader: User; author: User } | null = null;

test.afterEach(async ({ request }) => {
  if (!created) return;
  const { reader, author } = created;
  created = null;

  // API.md "Profiles": DELETE /api/profiles/:username/follow -> 200 Profile
  const unfollow = await request.delete(`/api/profiles/${encodeURIComponent(author.username)}/follow`, {
    headers: auth(reader.token),
  });
  expect(unfollow.status()).toBe(200);

  // API.md "Profiles": GET /api/profiles/:username -> 200 Profile, following is false after the unfollow
  const check = await request.get(`/api/profiles/${encodeURIComponent(author.username)}`, {
    headers: auth(reader.token),
  });
  expect(check.status()).toBe(200);
  expect((await check.json()).profile.following).toBe(false);
  // NOT IN THE MATERIAL: API.md has no request to delete a user, so the two new users stay in the app.
});

test.describe('Profile follow', () => {
  test('Follow persists after reload', async ({ page, request }) => {
    const reader = await signUp(request, 'followreader');
    const author = await signUp(request, 'followauthor');
    created = { reader, author }; // for afterEach clean-up

    // 1. Go to /login. Fill Email and Password, click "Sign in".
    await page.goto('/login');
    await page.getByLabel('Email').fill(reader.email);
    await page.getByLabel('Password').fill(reader.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // 2. Go to the new author's profile. A new user follows no one, so "Follow <author>" is shown.
    // ASSUMPTION: the button names follow the same pattern as for practice-author ("Follow <username>", "Unfollow <username>").
    await page.goto(`/profile/${encodeURIComponent(author.username)}`);
    const unfollow = page.getByRole('button', { name: `Unfollow ${author.username}` });
    const follow = page.getByRole('button', { name: `Follow ${author.username}`, exact: true });
    await expect(follow).toBeVisible();

    // 3. Click "Follow <author>". Expect "Unfollow <author>".
    await follow.click();
    await expect(unfollow).toBeVisible();

    // 4. Reload the page. Expect URL and heading.
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`/profile/${author.username}$`));
    await expect(page.getByRole('heading', { name: author.username })).toBeVisible();

    // 5. Expect "Unfollow <author>" and no "Follow <author>" button.
    await expect(unfollow).toBeVisible();
    await expect(follow).toHaveCount(0);
  });
});
