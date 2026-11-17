import { test, expect, APIRequestContext } from '@playwright/test';

// All rules come from P4/API.md. The section is named in a comment on each check.

type User = { username: string; email: string; token: string };

// API.md "Users and sign-in": POST /api/users -> 201 User. This app: password needs at least 8 characters.
async function signUp(request: APIRequestContext, name: string): Promise<User> {
  const unique = `${name}${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const response = await request.post('/api/users', {
    data: { user: { username: unique, email: `${unique}@example.com`, password: 'password123' } },
  });
  expect(response.status()).toBe(201);
  const json = await response.json();
  return { username: json.user.username, email: json.user.email, token: json.user.token };
}

function auth(token: string) {
  return { Authorization: `Token ${token}` }; // API.md "Basics"
}

// API.md "Articles": POST /api/articles -> 201 Article
async function createArticle(request: APIRequestContext, token: string, title: string) {
  const response = await request.post('/api/articles', {
    headers: auth(token),
    data: { article: { title, description: 'Contract desc', body: 'Contract body', tagList: ['contract'] } },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).article;
}

let author: User;
let otherUser: User;

test.beforeAll(async ({ request }) => {
  author = await signUp(request, 'contractauthor');
  otherUser = await signUp(request, 'contractother');
});

// ---------- Schema checks ----------

test('GET /api/articles/:slug answers with the Article shape from API.md', async ({ request }) => {
  const created = await createArticle(request, author.token, `Schema test ${Date.now()}`);

  const response = await request.get(`/api/articles/${created.slug}`); // API.md: token optional

  expect(response.status()).toBe(200); // API.md "Articles": GET /:slug -> 200 Article
  const json = await response.json();

  // API.md "Articles": Article = {"article":{slug,title,description,body,tagList,createdAt,updatedAt,favorited,favoritesCount,author}}
  // author is a Profile without the wrapper: {username,bio,image,following}
  expect(json).toMatchObject({
    article: {
      slug: expect.any(String), // ASSUMPTION: text. API.md does not give the type.
      title: expect.any(String), // ASSUMPTION: text. API.md does not give the type.
      description: expect.any(String), // ASSUMPTION: text. API.md does not give the type.
      body: expect.any(String), // ASSUMPTION: text. API.md does not give the type.
      tagList: expect.any(Array), // API.md rules: "a list of text values"
      createdAt: expect.any(String), // API.md "Basics": dates are ISO 8601 text
      updatedAt: expect.any(String), // API.md "Basics": dates are ISO 8601 text
      favorited: expect.any(Boolean), // ASSUMPTION: true/false. API.md does not give the type.
      favoritesCount: expect.any(Number), // ASSUMPTION: a number. API.md does not give the type.
      author: {
        username: expect.any(String), // ASSUMPTION: text. API.md does not give the type.
        bio: null, // API.md "Users and sign-in": a new user has bio null
        image: null, // API.md "Users and sign-in": a new user has image null
        following: expect.any(Boolean), // API.md "Profiles": following is true when ... (so true/false)
      },
    },
  });

  // API.md rules: tagList is a list of text values
  for (const tag of json.article.tagList) {
    expect(tag).toEqual(expect.any(String));
  }

  // No extra fields: the key lists must be exactly the ones API.md gives.
  // API.md "Articles": the answer has only the "article" wrapper
  expect(Object.keys(json).sort()).toEqual(['article']);
  // API.md "Articles": Article fields
  expect(Object.keys(json.article).sort()).toEqual(
    [
      'slug',
      'title',
      'description',
      'body',
      'tagList',
      'createdAt',
      'updatedAt',
      'favorited',
      'favoritesCount',
      'author',
    ].sort(),
  );
  // API.md "Profiles": author is a Profile without the wrapper
  expect(Object.keys(json.article.author).sort()).toEqual(['username', 'bio', 'image', 'following'].sort());
});

test('GET /api/user answers with the User shape from API.md', async ({ request }) => {
  const response = await request.get('/api/user', { headers: auth(author.token) });

  expect(response.status()).toBe(200); // API.md "Users and sign-in": GET /api/user -> 200 User
  const json = await response.json();

  // API.md "Users and sign-in": User = {"user":{email,token,username,bio,image}}
  expect(json).toMatchObject({
    user: {
      email: expect.any(String), // ASSUMPTION: text. API.md does not give the type.
      token: expect.any(String), // ASSUMPTION: text. API.md "Basics" sends it as "Token <token>".
      username: expect.any(String), // ASSUMPTION: text. API.md does not give the type.
      bio: null, // API.md: a new user has bio null
      image: null, // API.md: a new user has image null
    },
  });
});

// ---------- Auth tests ----------

test('GET /api/user with no token returns 401 token is missing', async ({ request }) => {
  const response = await request.get('/api/user');

  expect(response.status()).toBe(401); // API.md "Errors": no token where a token is needed
  expect(await response.json()).toEqual({ errors: { token: ['is missing'] } });
});

test('GET /api/user with a wrong token returns 401 token is invalid', async ({ request }) => {
  const response = await request.get('/api/user', { headers: auth('wrong-token') });

  expect(response.status()).toBe(401); // API.md "Errors": this app says "is invalid" for a wrong token
  expect(await response.json()).toEqual({ errors: { token: ['is invalid'] } });
});

test('changing someone else\'s article returns 403 forbidden and does not change it', async ({ request }) => {
  const created = await createArticle(request, author.token, `Auth test ${Date.now()}`);

  const response = await request.put(`/api/articles/${created.slug}`, {
    headers: auth(otherUser.token),
    data: { article: { description: 'Changed by someone else' } },
  });

  expect(response.status()).toBe(403); // API.md "Errors": someone else's article
  expect(await response.json()).toEqual({ errors: { article: ['forbidden'] } });

  // API.md "Articles": PUT is author only, so the article must stay as it was
  const after = await (await request.get(`/api/articles/${created.slug}`)).json();
  expect(after.article.description).toBe('Contract desc');
});
