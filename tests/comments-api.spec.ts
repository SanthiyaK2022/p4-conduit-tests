import { test, expect, APIRequestContext } from '@playwright/test';

// API test for comments. Every rule comes from P4/API.md "Comments".
// The test makes its own user and article with the API, and cleans up in afterEach.

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

// What the test made, so afterEach can delete it even when a check fails.
let created: { token: string; slug: string; commentId?: number | string } | null = null;

test.afterEach(async ({ request }) => {
  if (!created) return;
  const { token, slug, commentId } = created;
  created = null;
  const commentsUrl = `/api/articles/${encodeURIComponent(slug)}/comments`;

  if (commentId !== undefined) {
    // API.md "Comments": DELETE /api/articles/:slug/comments/:id -> 204, comment author only
    const del = await request.delete(`${commentsUrl}/${commentId}`, { headers: auth(token) });
    expect(del.status()).toBe(204);

    // GET again: the comment is no longer in the list.
    const list = await request.get(commentsUrl);
    expect(list.status()).toBe(200);
    const { comments } = await list.json();
    expect(comments.filter((c: { id: number | string }) => c.id === commentId)).toHaveLength(0);
  }

  // API.md "Articles": DELETE /api/articles/:slug -> 204, author only
  const delArticle = await request.delete(`/api/articles/${encodeURIComponent(slug)}`, { headers: auth(token) });
  expect(delArticle.status()).toBe(204);

  // GET again: API.md "Errors" -> 404 {"errors":{"article":["not found"]}}
  const gone = await request.get(`/api/articles/${encodeURIComponent(slug)}`);
  expect(gone.status()).toBe(404);
  // NOT IN THE MATERIAL: API.md has no request to delete a user, so the new user stays in the app.
});

test('POST a comment returns 201, and GET comments lists the saved comment', async ({ request }) => {
  const user = await signUp(request, 'commentapi');

  // API.md "Articles": POST /api/articles -> 201 Article
  const createArticle = await request.post('/api/articles', {
    headers: auth(user.token),
    data: { article: { title: `API comment target ${Date.now()}`, description: 'For a comment', body: 'Article body' } },
  });
  expect(createArticle.status()).toBe(201);
  const { article } = await createArticle.json();
  created = { token: user.token, slug: article.slug }; // for afterEach clean-up

  // API.md "Comments": POST /api/articles/:slug/comments, body {"comment":{"body"}} -> 201 {"comment":{...}}
  const commentText = `API comment ${Date.now()}`;
  const post = await request.post(`/api/articles/${encodeURIComponent(article.slug)}/comments`, {
    headers: auth(user.token),
    data: { comment: { body: commentText } },
  });
  expect(post.status()).toBe(201);
  const { comment } = await post.json();
  created.commentId = comment.id; // for afterEach clean-up

  // Comment: {"id","createdAt","updatedAt","body","author"}, author is a Profile.
  expect(comment.id).toBeDefined();
  expect(comment.body).toBe(commentText);
  expect(comment.author.username).toBe(user.username);

  // API.md "Comments": GET /api/articles/:slug/comments -> 200 {"comments":[...]}
  const list = await request.get(`/api/articles/${encodeURIComponent(article.slug)}/comments`);
  expect(list.status()).toBe(200);
  const { comments } = await list.json();
  expect(comments).toHaveLength(1); // the article is new, so this is its only comment
  expect(comments[0].id).toBe(comment.id);
  expect(comments[0].body).toBe(commentText);
  expect(comments[0].author.username).toBe(user.username);
});
