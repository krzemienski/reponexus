/**
 * API Debug Screen
 * 
 * This is a development-only screen to test API integration.
 * Add this to your app during development to verify connectivity.
 * 
 * To use:
 * 1. Navigate to this screen
 * 2. Tap "Run Tests"
 * 3. View results
 * 
 * This screen is useful for:
 * - Verifying backend connectivity
 * - Testing platform-specific URL handling
 * - Debugging API issues
 * - Validating authentication
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { runAllTests, TestSuite, TestResult } from '@/utils/testApi';
import { apiConfig, logApiConfig } from '@/utils/apiConfig';
import { useAuth } from '@/hooks/useAuth';

export default function DebugApiScreen() {
  const [testResults, setTestResults] = useState<TestSuite | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const runTests = async () => {
    setIsRunning(true);
    setTestResults(null);

    try {
      const results = await runAllTests();
      setTestResults(results);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to run tests: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const showConfig = () => {
    logApiConfig();
    const clientIdStatus = apiConfig.githubClientId ? 'Set' : 'Not Set';
    Alert.alert(
      'API Configuration',
      'Environment: ' + apiConfig.environment + '\n' +
      'Platform: ' + apiConfig.platform + '\n' +
      'Base URL: ' + apiConfig.baseUrl + '\n' +
      'WebSocket URL: ' + apiConfig.wsUrl + '\n' +
      'GitHub Client ID: ' + clientIdStatus
    );
  };

  const getResultIcon = (result: TestResult) => {
    return result.success ? '✅' : '❌';
  };

  const getResultColor = (result: TestResult) => {
    return result.success ? '#22c55e' : '#ef4444';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              API Debug & Testing
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Test backend connectivity and API integration
            </Text>
          </Card.Content>
        </Card>

        {/* Configuration */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Configuration
            </Text>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Environment:</Text>
              <Text style={styles.configValue}>{apiConfig.environment}</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Platform:</Text>
              <Text style={styles.configValue}>{apiConfig.platform}</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>API URL:</Text>
              <Text style={styles.configValue}>{apiConfig.baseUrl}</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>WebSocket:</Text>
              <Text style={styles.configValue}>{apiConfig.wsUrl}</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Auth Status:</Text>
              <Text style={[styles.configValue, { color: isAuthenticated ? '#22c55e' : '#ef4444' }]}>
                {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </Text>
            </View>
            {user && (
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>User:</Text>
                <Text style={styles.configValue}>{user.login}</Text>
              </View>
            )}
          </Card.Content>
          <Card.Actions>
            <Button onPress={showConfig}>Show in Console</Button>
          </Card.Actions>
        </Card>

        {/* Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Actions
            </Text>
            <Button
              mode="contained"
              onPress={runTests}
              loading={isRunning}
              disabled={isRunning}
              style={styles.button}
            >
              {isRunning ? 'Running Tests...' : 'Run API Tests'}
            </Button>
            <Text variant="bodySmall" style={styles.hint}>
              Tests API connectivity and endpoint availability
            </Text>
          </Card.Content>
        </Card>

        {/* Test Results */}
        {testResults && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Test Results
              </Text>
              
              {/* Summary */}
              <View style={styles.summary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total:</Text>
                  <Text style={styles.summaryValue}>{testResults.results.length}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: '#22c55e' }]}>Passed:</Text>
                  <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{testResults.passed}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: '#ef4444' }]}>Failed:</Text>
                  <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{testResults.failed}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Duration:</Text>
                  <Text style={styles.summaryValue}>{testResults.duration}ms</Text>
                </View>
              </View>

              {/* Individual Results */}
              <View style={styles.results}>
                {testResults.results.map((result, index) => (
                  <View
                    key={index}
                    style={[
                      styles.resultItem,
                      { borderLeftColor: getResultColor(result) }
                    ]}
                  >
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultIcon}>{getResultIcon(result)}</Text>
                      <Text style={styles.resultName}>{result.name}</Text>
                      {result.duration && (
                        <Text style={styles.resultDuration}>{result.duration}ms</Text>
                      )}
                    </View>
                    <Text style={styles.resultMessage}>{result.message}</Text>
                    {result.error && (
                      <Text style={styles.resultError}>Error: {result.error}</Text>
                    )}
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Instructions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Instructions
            </Text>
            <Text variant="bodyMedium" style={styles.instruction}>
              1. Ensure backend is running at {apiConfig.baseUrl}
            </Text>
            <Text variant="bodyMedium" style={styles.instruction}>
              2. Click "Run API Tests" to validate connectivity
            </Text>
            <Text variant="bodyMedium" style={styles.instruction}>
              3. Check results for any failures
            </Text>
            <Text variant="bodyMedium" style={styles.instruction}>
              4. For physical devices, ensure API_URL uses your local IP
            </Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  configLabel: {
    fontWeight: '600',
    color: '#666',
  },
  configValue: {
    color: '#000',
    fontFamily: 'monospace',
  },
  button: {
    marginTop: 8,
  },
  hint: {
    marginTop: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  results: {
    marginTop: 8,
  },
  resultItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  resultName: {
    flex: 1,
    fontWeight: '600',
    fontSize: 14,
  },
  resultDuration: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  resultMessage: {
    fontSize: 13,
    color: '#444',
    marginLeft: 24,
  },
  resultError: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 24,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  instruction: {
    marginBottom: 8,
    color: '#444',
  },
});
