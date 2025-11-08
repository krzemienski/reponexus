import { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button, Text, Surface, Divider, Card, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useDevSettings } from '@/hooks/useTokenAuth';
import { useAuthStore } from '@/stores/authStore';

export default function DevSettingsScreen() {
  const router = useRouter();
  const { tokenInfo, getTokenInfo, clearAuthData, getCurrentUser } = useDevSettings();
  const { user, isAuthenticated } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Load token info on mount and set up auto-refresh
   */
  useEffect(() => {
    loadTokenInfo();

    // Refresh token info every 5 seconds
    const interval = setInterval(() => {
      loadTokenInfo();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Load token information
   */
  const loadTokenInfo = useCallback(async () => {
    try {
      setRefreshing(true);
      await getTokenInfo();
    } catch (error) {
      console.error('Failed to load token info:', error);
    } finally {
      setRefreshing(false);
    }
  }, [getTokenInfo]);

  /**
   * Copy token to clipboard
   */
  const handleCopyToken = async () => {
    try {
      if (tokenInfo.token) {
        await Clipboard.setStringAsync(tokenInfo.token);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Token copied to clipboard');
      }
    } catch (error) {
      console.error('Failed to copy token:', error);
      Alert.alert('Error', 'Failed to copy token to clipboard');
    }
  };

  /**
   * Clear auth data
   */
  const handleClearAuthData = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      Alert.alert(
        'Clear Auth Data',
        'Are you sure you want to clear all authentication data? You will be logged out.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: async () => {
              try {
                await clearAuthData();
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'Auth data cleared');
                router.replace('/(auth)/login');
              } catch (error) {
                console.error('Failed to clear auth data:', error);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Error', 'Failed to clear auth data');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Clear auth data failed:', error);
    }
  };

  /**
   * Refresh user data
   */
  const handleRefreshUser = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRefreshing(true);

      const currentUser = await getCurrentUser();

      if (currentUser) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', `User data refreshed: ${currentUser.login}`);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', 'Failed to refresh user data');
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to refresh user data');
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Navigate back
   */
  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Only show in DEV mode
  if (!__DEV__) {
    return (
      <Surface style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text variant="titleLarge">Not available in production</Text>
      </Surface>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }}>
      <Surface style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 40 }}>
          <IconButton icon="arrow-left" onPress={handleBack} />
          <Text variant="headlineMedium" style={{ fontWeight: 'bold', flex: 1 }}>
            Developer Settings
          </Text>
          <IconButton icon="refresh" onPress={loadTokenInfo} disabled={refreshing} />
        </View>

        {/* Auth Status */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: 'bold' }}>
              Authentication Status
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text variant="bodyMedium">Status:</Text>
              <Text
                variant="bodyMedium"
                style={{
                  color: isAuthenticated ? '#22c55e' : '#ef4444',
                  fontWeight: 'bold',
                }}
              >
                {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </Text>
            </View>
            {user && (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text variant="bodyMedium">User:</Text>
                  <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
                    {user.login}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodyMedium">Email:</Text>
                  <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
                    {user.email || 'N/A'}
                  </Text>
                </View>
              </>
            )}
          </Card.Content>
          <Card.Actions>
            <Button onPress={handleRefreshUser} disabled={refreshing || !isAuthenticated}>
              Refresh User Data
            </Button>
          </Card.Actions>
        </Card>

        {/* Token Info */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: 'bold' }}>
              JWT Token Info
            </Text>

            {tokenInfo.token ? (
              <>
                <View style={{ marginBottom: 12 }}>
                  <Text variant="bodySmall" style={{ opacity: 0.7, marginBottom: 4 }}>
                    Access Token:
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      padding: 8,
                      borderRadius: 4,
                    }}
                    numberOfLines={2}
                    ellipsizeMode="middle"
                  >
                    {tokenInfo.token}
                  </Text>
                </View>

                <Divider style={{ marginBottom: 12 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text variant="bodyMedium">Expires At:</Text>
                  <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
                    {tokenInfo.expiresAt
                      ? new Date(tokenInfo.expiresAt).toLocaleString()
                      : 'N/A'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodyMedium">Time Remaining:</Text>
                  <Text
                    variant="bodyMedium"
                    style={{
                      fontWeight: 'bold',
                      color:
                        tokenInfo.timeRemaining === 'Expired'
                          ? '#ef4444'
                          : '#22c55e',
                    }}
                  >
                    {tokenInfo.timeRemaining || 'N/A'}
                  </Text>
                </View>
              </>
            ) : (
              <Text variant="bodyMedium" style={{ opacity: 0.6 }}>
                No token found
              </Text>
            )}
          </Card.Content>
          <Card.Actions>
            <Button onPress={handleCopyToken} disabled={!tokenInfo.token}>
              Copy Token
            </Button>
          </Card.Actions>
        </Card>

        {/* Actions */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: 'bold' }}>
              Developer Actions
            </Text>
            <Text variant="bodySmall" style={{ opacity: 0.7, marginBottom: 12 }}>
              These actions are for development and testing purposes only.
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => router.push('/(auth)/token-login')}
              icon="key"
              style={{ flex: 1 }}
            >
              Token Login
            </Button>
          </Card.Actions>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={handleClearAuthData}
              buttonColor="#ef4444"
              icon="delete"
              style={{ flex: 1 }}
            >
              Clear Auth Data
            </Button>
          </Card.Actions>
        </Card>

        {/* Warning */}
        <Surface
          style={{
            padding: 16,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <Text variant="bodySmall" style={{ color: '#ef4444', textAlign: 'center' }}>
            Development mode only - This screen will not be available in production
          </Text>
        </Surface>
      </Surface>
    </ScrollView>
  );
}
