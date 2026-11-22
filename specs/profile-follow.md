# Profile page and following an author

## Application Overview

Profile page /profile/practice-author in the Conduit practice app (http://127.0.0.1:3000). Signed-out visitors see no follow button. Signed in as practice-reader, the button is named "Follow practice-author" or "Unfollow practice-author". OBSERVED: with fresh data practice-reader already follows practice-author, so the page shows "Unfollow practice-author" at the start. The tests must not rely on a fresh state, so they unfollow first when needed.

## Test Scenarios

### 1. Profile follow

**Seed:** `tests/seed.spec.ts`

#### 1.1. Follow persists after reload

**File:** `tests/profile-follow/follow-persists.spec.ts`

**Steps:**
  1. Go to /login. Fill the Email field (getByLabel 'Email') with practice-reader@example.com and the Password field (getByLabel 'Password') with Practice123. Click button 'Sign in'.
    - expect: The user is signed in; the nav shows link 'practice-reader'.
  2. Go to /profile/practice-author. If button 'Unfollow practice-author' is visible, click it first so the start state is not-following (practice-reader already follows practice-author on fresh data).
    - expect: Button 'Follow practice-author' is visible.
  3. Click button 'Follow practice-author'.
    - expect: Button 'Unfollow practice-author' is visible.
  4. Reload the page (page.reload()).
    - expect: The URL is still /profile/practice-author and the heading 'practice-author' is visible.
  5. Check the follow button after the reload.
    - expect: Button 'Unfollow practice-author' is visible; button 'Follow practice-author' is not present.

#### 1.2. Signed-out visitor cannot follow

**File:** `tests/profile-follow/signed-out.spec.ts`

**Steps:**
  1. Without signing in (fresh browser context), go to /profile/practice-author.
    - expect: Heading 'practice-author' and the text 'I write about testing and quality.' are visible; nav shows links 'Sign in' and 'Sign up'.
  2. Look for follow buttons.
    - expect: No button 'Follow practice-author' and no button 'Unfollow practice-author' is shown (observed: no button on the page).
  3. Check the profile tabs.
    - expect: Links 'My Articles' and 'Favorited Articles' are visible.
