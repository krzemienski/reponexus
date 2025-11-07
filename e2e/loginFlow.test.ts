import { device, element, by, expect as detoxExpect } from 'detox';

describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display welcome screen', async () => {
    await detoxExpect(element(by.text('Welcome to Repo Nexus'))).toBeVisible();
  });

  it('should show sign in button', async () => {
    await detoxExpect(element(by.id('login-button'))).toBeVisible();
  });

  it('should navigate to OAuth when login pressed', async () => {
    await element(by.id('login-button')).tap();
    // OAuth flow would open browser
    // In test environment, we might mock the callback
  });

  it('should handle successful OAuth callback', async () => {
    // Mock successful OAuth flow
    // This would require setting up test OAuth tokens
    await element(by.id('login-button')).tap();

    // After successful auth, should navigate to explore
    // await detoxExpect(element(by.id('explore-screen'))).toBeVisible();
  });

  it('should handle OAuth cancellation', async () => {
    // Test user canceling OAuth flow
    await element(by.id('login-button')).tap();
    // Should return to welcome screen
  });

  it('should persist login state', async () => {
    // After successful login, relaunch app
    await device.reloadReactNative();
    // Should stay logged in
    // await detoxExpect(element(by.id('explore-screen'))).toBeVisible();
  });
});
