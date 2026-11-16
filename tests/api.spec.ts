import { test, expect, APIRequestContext } from '@playwright/test';

// All rules come from P4/API.md. The section is named in a comment on each check.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/; // API.md "Basics": ISO 8601

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

async function createArticle(request: APIRequestContext, token: string, article: object) {
  return request.post('/api/articles', { headers: auth(token), data: { article } });
}

let author: User;
let otherUser: User;

test.beforeAll(async ({ request }) => {
  author = await signUp(request, 'author');
  otherUser = await signUp(request, 'other');
});

// ---------- Positive tests ----------

test('create an article returns 201 and the full Article', async ({ request }) => {
  const title = `Create test ${Date.now()}`;
  const response = await createArticle(request, author.token, {
    title,
    description: 'Short description',
    body: 'Article body text',
    tagList: ['zeta', 'alpha', 'zeta'],
  });

  expect(response.status()).toBe(201); // API.md "Articles": POST -> 201 Article
  const { article } = await response.json();
  expect(article.title).toBe(title);
  expect(article.description).toBe('Short description');
  expect(article.body).toBe('Article body text');
  // API.md "Articles" rules: tags keep the sent order, repeated tags kept once
  expect(article.tagList).toEqual(['zeta', 'alpha']);
  expect(typeof article.slug).toBe('string');
  expect(article.slug.length).toBeGreaterThan(0);
  expect(article.createdAt).toMatch(ISO_DATE);
  expect(article.updatedAt).toMatch(ISO_DATE);
  expect(typeof article.favorited).toBe('boolean');
  expect(typeof article.favoritesCount).toBe('number');
  // API.md: author is a Profile without the wrapper
  expect(article.author.username).toBe(author.username);
  expect(article.author).toHaveProperty('bio');
  expect(article.author).toHaveProperty('image');
  expect(article.author).toHaveProperty('following');
});

test('read an article by slug returns 200 and the same Article', async ({ request }) => {
  const title = `Read test ${Date.now()}`;
  const created = await (
    await createArticle(request, author.token, { title, description: 'Read desc', body: 'Read body', tagList: ['api'] })
  ).json();

  const response = await request.get(`/api/articles/${created.article.slug}`);

  expect(response.status()).toBe(200); // API.md "Articles": GET /:slug -> 200 Article, token optional
  const { article } = await response.json();
  expect(article.slug).toBe(created.article.slug);
  expect(article.title).toBe(title);
  expect(article.description).toBe('Read desc');
  expect(article.body).toBe('Read body');
  expect(article.tagList).toEqual(['api']);
  expect(article.createdAt).toBe(created.article.createdAt);
  expect(article.author.username).toBe(author.username);
});

test('update an article changes only the fields sent and changes the slug when the title changes', async ({ request }) => {
  const created = await (
    await createArticle(request, author.token, {
      title: `Update test ${Date.now()}`,
      description: 'Old desc',
      body: 'Old body',
      tagList: ['one', 'two'],
    })
  ).json();
  const newTitle = `Updated title ${Date.now()}`;

  const response = await request.put(`/api/articles/${created.article.slug}`, {
    headers: auth(author.token),
    data: { article: { title: newTitle, tagList: [] } },
  });

  expect(response.status()).toBe(200); // API.md "Articles": PUT -> 200 Article
  const { article } = await response.json();
  expect(article.title).toBe(newTitle);
  // API.md rules: a field you do not send stays as it was
  expect(article.description).toBe('Old desc');
  expect(article.body).toBe('Old body');
  // API.md rules: tagList [] removes all tags
  expect(article.tagList).toEqual([]);
  // API.md rules (this app): when the title changes, the slug changes too
  expect(article.slug).not.toBe(created.article.slug);
});

test('delete an article returns 204 with no body, and the article is gone', async ({ request }) => {
  const created = await (
    await createArticle(request, author.token, { title: `Delete test ${Date.now()}`, description: 'd', body: 'b' })
  ).json();

  const response = await request.delete(`/api/articles/${created.article.slug}`, { headers: auth(author.token) });

  expect(response.status()).toBe(204); // API.md "Articles": DELETE -> 204, no body
  expect(await response.text()).toBe('');

  const after = await request.get(`/api/articles/${created.article.slug}`);
  expect(after.status()).toBe(404); // API.md "Errors": 404 Not found
  expect(await after.json()).toEqual({ errors: { article: ['not found'] } });
});

// ---------- Negative tests ----------

test('create an article without a token returns 401 token is missing', async ({ request }) => {
  const response = await request.post('/api/articles', {
    data: { article: { title: 'No token', description: 'd', body: 'b' } },
  });

  expect(response.status()).toBe(401); // API.md "Errors": no token
  expect(await response.json()).toEqual({ errors: { token: ['is missing'] } });
});

test('create an article without a title returns 422 title can\'t be blank', async ({ request }) => {
  const response = await createArticle(request, author.token, { description: 'd', body: 'b' });

  expect(response.status()).toBe(422); // API.md "Errors" + rules: title is required
  expect(await response.json()).toEqual({ errors: { title: ["can't be blank"] } });
});

test('update someone else\'s article returns 403 forbidden and does not change it', async ({ request }) => {
  const created = await (
    await createArticle(request, author.token, { title: `Forbidden test ${Date.now()}`, description: 'Original', body: 'b' })
  ).json();

  const response = await request.put(`/api/articles/${created.article.slug}`, {
    headers: auth(otherUser.token),
    data: { article: { description: 'Hacked' } },
  });

  expect(response.status()).toBe(403); // API.md "Errors": someone else's article
  expect(await response.json()).toEqual({ errors: { article: ['forbidden'] } });

  const after = await (await request.get(`/api/articles/${created.article.slug}`)).json();
  expect(after.article.description).toBe('Original');
});

test('update with tagList null returns 422 with a tagList error', async ({ request }) => {
  const created = await (
    await createArticle(request, author.token, { title: `Null tags ${Date.now()}`, description: 'd', body: 'b', tagList: ['keep'] })
  ).json();

  const response = await request.put(`/api/articles/${created.article.slug}`, {
    headers: auth(author.token),
    data: { article: { tagList: null } },
  });

  expect(response.status()).toBe(422); // API.md rules: tagList null gives 422
  const json = await response.json();
  // API.md "Errors": the key names the field. ASSUMPTION: the key is "tagList". The message text is NOT IN THE MATERIAL.
  expect(Array.isArray(json.errors.tagList)).toBe(true);
  expect(json.errors.tagList.length).toBeGreaterThan(0);
});

test('delete an article with a wrong token returns 401 token is invalid', async ({ request }) => {
  const created = await (
    await createArticle(request, author.token, { title: `Bad token ${Date.now()}`, description: 'd', body: 'b' })
  ).json();

  const response = await request.delete(`/api/articles/${created.article.slug}`, { headers: auth('wrong-token') });

  expect(response.status()).toBe(401); // API.md "Errors": this app says "is invalid" for a wrong token
  expect(await response.json()).toEqual({ errors: { token: ['is invalid'] } });

  const after = await request.get(`/api/articles/${created.article.slug}`);
  expect(after.status()).toBe(200);
});

test('read an article that does not exist returns 404 article not found', async ({ request }) => {
  const response = await request.get(`/api/articles/no-such-article-${Date.now()}`);

  expect(response.status()).toBe(404); // API.md "Errors": 404
  expect(await response.json()).toEqual({ errors: { article: ['not found'] } });
});
