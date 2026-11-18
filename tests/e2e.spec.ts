import { test, expect, APIRequestContext, Page } from '@playwright/test';

// End-to-end tests: make the user with the API, do the journey in the page, check the result with the API.
// API rules come from P4/API.md. Labels and button names come from P4/app/public/app.js.

type User = { username: string; token: string };

// API.md "Users and sign-in": POST /api/users -> 201 User. Password needs at least 8 characters.
async function signUp(request: APIRequestContext, name: string): Promise<User> {
  const unique = `${name}${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const response = await request.post('/api/users', {
    data: { user: { username: unique, email: `${unique}@example.com`, password: 'password123' } },
  });
  expect(response.status()).toBe(201);
  const json = await response.json();
  return { username: json.user.username, token: json.user.token };
}

function auth(token: string) {
  return { Authorization: `Token ${token}` }; // API.md "Basics"
}

// The page keeps the sign-in token in localStorage, key jwtToken.
// Set it before any page script runs, so the page starts signed in.
async function giveToken(page: Page, token: string) {
  await page.addInitScript((t) => {
    window.localStorage.setItem('jwtToken', t);
  }, token);
}

// What each test made, so afterEach can delete it even when a check fails.
let created: { token: string; username: string; slug?: string } | null = null;

test.afterEach(async ({ request }) => {
  if (!created?.slug) {
    created = null;
    return;
  }
  const { token, username, slug } = created;
  created = null;

  // API.md "Comments": DELETE /api/articles/:slug/comments/:id -> 204, comment author only
  const list = await request.get(`/api/articles/${encodeURIComponent(slug)}/comments`);
  if (list.status() === 200) {
    const { comments } = await list.json();
    for (const c of comments.filter((c: { author: { username: string } }) => c.author.username === username)) {
      const del = await request.delete(`/api/articles/${encodeURIComponent(slug)}/comments/${c.id}`, { headers: auth(token) });
      expect(del.status()).toBe(204);
    }
  }

  // API.md "Articles": DELETE /api/articles/:slug -> 204, author only
  const del = await request.delete(`/api/articles/${encodeURIComponent(slug)}`, { headers: auth(token) });
  expect(del.status()).toBe(204);
});

test('a signed-in user publishes a new article in the editor', async ({ page, request }) => {
  const user = await signUp(request, 'e2eauthor');
  await giveToken(page, user.token);

  const title = `E2E article ${Date.now()}`;
  const description = 'Written in the editor';
  const body = 'This article was published by an end-to-end test.';

  await page.goto('/editor');
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByLabel("What's this article about?").fill(description);
  await page.getByLabel('Write your article').fill(body);
  await page.getByLabel('Tags', { exact: true }).fill('e2e, playwright');
  await page.getByRole('button', { name: 'Publish Article' }).click();

  // After publishing, the page opens /article/<slug>.
  await page.waitForURL(/\/article\/[^/]+$/);
  const slug = decodeURIComponent(new URL(page.url()).pathname.split('/').pop()!);
  created = { token: user.token, username: user.username, slug }; // for afterEach clean-up
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();

  // Check with the API that what was saved matches what was entered.
  const response = await request.get(`/api/articles/${encodeURIComponent(slug)}`); // API.md "Articles": GET -> 200 Article
  expect(response.status()).toBe(200);
  const { article } = await response.json();
  expect(article.title).toBe(title);
  expect(article.description).toBe(description);
  expect(article.body).toBe(body);
  expect(article.tagList).toEqual(['e2e', 'playwright']); // API.md "Articles": tags keep the sent order
  expect(article.author.username).toBe(user.username);
});

test('a signed-in user posts a comment on an article', async ({ page, request }) => {
  const user = await signUp(request, 'e2ecommenter');

  // API.md "Articles": POST /api/articles -> 201 Article
  const createResponse = await request.post('/api/articles', {
    headers: auth(user.token),
    data: { article: { title: `E2E comment target ${Date.now()}`, description: 'For a comment', body: 'Article body' } },
  });
  expect(createResponse.status()).toBe(201);
  const { article } = await createResponse.json();
  created = { token: user.token, username: user.username, slug: article.slug }; // for afterEach clean-up

  await giveToken(page, user.token);
  await page.goto(`/article/${encodeURIComponent(article.slug)}`);

  const commentText = `E2E comment ${Date.now()}`;
  await page.getByLabel('Write a comment').fill(commentText);
  await page.getByRole('button', { name: 'Post Comment' }).click();

  // The page shows the list again after the comment is saved.
  await expect(page.getByText(commentText)).toBeVisible();

  // Check with the API. API.md "Comments": GET /api/articles/:slug/comments -> 200 {"comments":[...]}
  const response = await request.get(`/api/articles/${encodeURIComponent(article.slug)}/comments`);
  expect(response.status()).toBe(200);
  const { comments } = await response.json();
  const mine = comments.filter((c: { body: string }) => c.body === commentText);
  expect(mine).toHaveLength(1);
  expect(mine[0].author.username).toBe(user.username);
});
