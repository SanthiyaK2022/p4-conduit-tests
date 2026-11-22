// spec: specs/profile-follow.md
// seed: tests/seed.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Profile follow', () => {
  test('Signed-out visitor cannot follow', async ({ page }) => {
    // 1. Without signing in, go to /profile/practice-author.
    await page.goto('http://127.0.0.1:3000/profile/practice-author');
    await expect(page.getByRole('heading', { name: 'practice-author', level: 1 })).toBeVisible();
    await expect(page.getByText('I write about testing and quality.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();

    // 2. Expect no Follow / Unfollow button.
    await expect(page.getByRole('button', { name: 'Follow practice-author', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Unfollow practice-author', exact: true })).toHaveCount(0);

    // 3. Expect the links "My Articles" and "Favorited Articles".
    await expect(page.getByRole('link', { name: 'My Articles' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Favorited Articles' })).toBeVisible();
  });
});
