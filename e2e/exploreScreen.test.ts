import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('Explore Screen', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Assume we're already logged in for these tests
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display repository list', async () => {
    await waitFor(element(by.id('repo-list')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should display search bar', async () => {
    await detoxExpect(element(by.id('search-input'))).toBeVisible();
  });

  it('should search repositories', async () => {
    await element(by.id('search-input')).typeText('react');
    await element(by.id('search-input')).tapReturnKey();

    await waitFor(element(by.text('React')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should clear search', async () => {
    await element(by.id('search-input')).typeText('typescript');
    await element(by.id('search-clear-button')).tap();

    const searchInput = element(by.id('search-input'));
    await detoxExpect(searchInput).toHaveText('');
  });

  it('should filter by language', async () => {
    await element(by.id('filter-button')).tap();
    await element(by.text('JavaScript')).tap();
    await element(by.id('apply-filters')).tap();

    // Verify filtered results
    await waitFor(element(by.id('repo-list')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should navigate to repository detail', async () => {
    await waitFor(element(by.id('repo-card-0')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('repo-card-0')).tap();

    await waitFor(element(by.id('repo-detail-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should star repository', async () => {
    await waitFor(element(by.id('repo-card-0')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('star-button-0')).tap();

    // Verify star count updated
    await waitFor(element(by.id('star-button-0')))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should scroll repository list', async () => {
    await waitFor(element(by.id('repo-list')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('repo-list')).scroll(500, 'down');

    // Should load more repositories
    await waitFor(element(by.id('repo-card-10')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should pull to refresh', async () => {
    await waitFor(element(by.id('repo-list')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('repo-list')).swipe('down', 'slow', 0.9);

    // Should show loading indicator
    await waitFor(element(by.id('loading-indicator')))
      .toBeVisible()
      .withTimeout(1000);
  });

  it('should handle empty state', async () => {
    await element(by.id('search-input')).typeText('nonexistentrepo12345xyz');
    await element(by.id('search-input')).tapReturnKey();

    await waitFor(element(by.id('empty-state')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should handle error state', async () => {
    // Simulate network error by toggling airplane mode
    await device.setStatusBar({ dataNetwork: 'disabled' });

    await element(by.id('repo-list')).swipe('down', 'slow', 0.9);

    await waitFor(element(by.id('error-state')))
      .toBeVisible()
      .withTimeout(5000);

    // Re-enable network
    await device.setStatusBar({ dataNetwork: 'wifi' });
  });
});
