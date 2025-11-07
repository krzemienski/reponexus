/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate GitHub username
 */
export function isValidGitHubUsername(username: string): boolean {
  // GitHub usernames can only contain alphanumeric characters and hyphens
  // Cannot start or end with a hyphen
  // Max 39 characters
  const usernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
  return usernameRegex.test(username);
}

/**
 * Validate repository name
 */
export function isValidRepoName(name: string): boolean {
  // Repository names can contain alphanumeric characters, hyphens, underscores, and periods
  // Max 100 characters
  const repoRegex = /^[a-zA-Z0-9._-]{1,100}$/;
  return repoRegex.test(name);
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  return query.trim().replace(/[<>]/g, '');
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page: number, perPage: number): {
  valid: boolean;
  error?: string;
} {
  if (page < 1) {
    return { valid: false, error: 'Page must be greater than 0' };
  }
  if (perPage < 1 || perPage > 100) {
    return { valid: false, error: 'Per page must be between 1 and 100' };
  }
  return { valid: true };
}
