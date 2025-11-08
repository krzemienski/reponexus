/**
 * API Testing Utilities
 *
 * Provides utilities to test API connectivity and endpoints.
 * Useful for debugging integration issues.
 */

import apiClient from '@/services/api/client';
import { API_ENDPOINTS } from '@/utils/constants';
import { apiConfig } from '@/utils/apiConfig';

export interface TestResult {
  name: string;
  success: boolean;
  message: string;
  duration?: number;
  error?: string;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

/**
 * Test API connectivity
 */
export async function testConnectivity(): Promise<TestResult> {
  const start = Date.now();
  const name = 'API Connectivity';

  try {
    const response = await apiClient.get('/health', {
      timeout: 5000,
    });

    const duration = Date.now() - start;

    if (response.status === 200) {
      return {
        name,
        success: true,
        message: `Connected to ${apiConfig.baseUrl}`,
        duration,
      };
    } else {
      return {
        name,
        success: false,
        message: `Unexpected status: ${response.status}`,
        duration,
      };
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    return {
      name,
      success: false,
      message: 'Failed to connect to backend',
      duration,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Test authentication endpoints (unauthenticated)
 */
export async function testAuthEndpoints(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test /auth/me (should return 401 without token)
  const start1 = Date.now();
  try {
    await apiClient.get(API_ENDPOINTS.ME);
    results.push({
      name: 'Auth /me endpoint',
      success: false,
      message: 'Should return 401 without token',
      duration: Date.now() - start1,
    });
  } catch (error: any) {
    const duration = Date.now() - start1;
    if (error.status === 401) {
      results.push({
        name: 'Auth /me endpoint',
        success: true,
        message: 'Correctly returns 401 without token',
        duration,
      });
    } else {
      results.push({
        name: 'Auth /me endpoint',
        success: false,
        message: `Unexpected error: ${error.message}`,
        duration,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Test repository endpoints (unauthenticated)
 */
export async function testRepositoryEndpoints(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test repositories list
  const start1 = Date.now();
  try {
    await apiClient.get(API_ENDPOINTS.REPOSITORIES);
    results.push({
      name: 'Repositories list',
      success: false,
      message: 'Should return 401 without token',
      duration: Date.now() - start1,
    });
  } catch (error: any) {
    const duration = Date.now() - start1;
    if (error.status === 401) {
      results.push({
        name: 'Repositories list',
        success: true,
        message: 'Endpoint exists (requires auth)',
        duration,
      });
    } else {
      results.push({
        name: 'Repositories list',
        success: false,
        message: `Unexpected error: ${error.message}`,
        duration,
        error: error.message,
      });
    }
  }

  // Test trending endpoint
  const start2 = Date.now();
  try {
    await apiClient.get(API_ENDPOINTS.TRENDING, {
      params: { period: 'daily' },
    });
    results.push({
      name: 'Trending repositories',
      success: false,
      message: 'Should return 401 without token',
      duration: Date.now() - start2,
    });
  } catch (error: any) {
    const duration = Date.now() - start2;
    if (error.status === 401) {
      results.push({
        name: 'Trending repositories',
        success: true,
        message: 'Endpoint exists (requires auth)',
        duration,
      });
    } else {
      results.push({
        name: 'Trending repositories',
        success: false,
        message: `Unexpected error: ${error.message}`,
        duration,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Test topic endpoints (unauthenticated)
 */
export async function testTopicEndpoints(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test topics list
  const start = Date.now();
  try {
    await apiClient.get(API_ENDPOINTS.TOPICS);
    results.push({
      name: 'Topics list',
      success: false,
      message: 'Should return 401 without token',
      duration: Date.now() - start,
    });
  } catch (error: any) {
    const duration = Date.now() - start;
    if (error.status === 401) {
      results.push({
        name: 'Topics list',
        success: true,
        message: 'Endpoint exists (requires auth)',
        duration,
      });
    } else {
      results.push({
        name: 'Topics list',
        success: false,
        message: `Unexpected error: ${error.message}`,
        duration,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Test search endpoints (unauthenticated)
 */
export async function testSearchEndpoints(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test search repositories
  const start1 = Date.now();
  try {
    await apiClient.get(API_ENDPOINTS.SEARCH_REPOSITORIES, {
      params: { q: 'test' },
    });
    results.push({
      name: 'Search repositories',
      success: false,
      message: 'Should return 401 without token',
      duration: Date.now() - start1,
    });
  } catch (error: any) {
    const duration = Date.now() - start1;
    if (error.status === 401) {
      results.push({
        name: 'Search repositories',
        success: true,
        message: 'Endpoint exists (requires auth)',
        duration,
      });
    } else {
      results.push({
        name: 'Search repositories',
        success: false,
        message: `Unexpected error: ${error.message}`,
        duration,
        error: error.message,
      });
    }
  }

  // Test search topics
  const start2 = Date.now();
  try {
    await apiClient.get(API_ENDPOINTS.SEARCH_TOPICS, {
      params: { q: 'test' },
    });
    results.push({
      name: 'Search topics',
      success: false,
      message: 'Should return 401 without token',
      duration: Date.now() - start2,
    });
  } catch (error: any) {
    const duration = Date.now() - start2;
    if (error.status === 401) {
      results.push({
        name: 'Search topics',
        success: true,
        message: 'Endpoint exists (requires auth)',
        duration,
      });
    } else {
      results.push({
        name: 'Search topics',
        success: false,
        message: `Unexpected error: ${error.message}`,
        duration,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Run all API tests
 */
export async function runAllTests(): Promise<TestSuite> {
  const start = Date.now();
  const results: TestResult[] = [];

  // Test connectivity first
  const connectivityResult = await testConnectivity();
  results.push(connectivityResult);

  // Only continue if connectivity test passed
  if (connectivityResult.success) {
    const authResults = await testAuthEndpoints();
    const repoResults = await testRepositoryEndpoints();
    const topicResults = await testTopicEndpoints();
    const searchResults = await testSearchEndpoints();

    results.push(...authResults);
    results.push(...repoResults);
    results.push(...topicResults);
    results.push(...searchResults);
  }

  const duration = Date.now() - start;
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    name: 'API Integration Tests',
    results,
    passed,
    failed,
    duration,
  };
}

/**
 * Format test results for console output
 */
export function formatTestResults(suite: TestSuite): string {
  let output = `\n=== ${suite.name} ===\n\n`;

  suite.results.forEach((result) => {
    const icon = result.success ? '✓' : '✗';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    output += `${icon} ${result.name}${duration}\n`;
    output += `  ${result.message}\n`;
    if (result.error) {
      output += `  Error: ${result.error}\n`;
    }
    output += '\n';
  });

  output += `\nResults: ${suite.passed} passed, ${suite.failed} failed\n`;
  output += `Duration: ${suite.duration}ms\n`;

  return output;
}

/**
 * Log test results to console
 */
export async function logApiTests(): Promise<void> {
  console.log('Running API integration tests...');
  const suite = await runAllTests();
  console.log(formatTestResults(suite));
}
