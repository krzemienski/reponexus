import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { SecureStorageService } from '@/services/storage/secureStore';
import { STORAGE_KEYS } from '@/utils/constants';

/**
 * Biometric Authentication Types
 */
export type BiometricType = 'FINGERPRINT' | 'FACIAL_RECOGNITION' | 'IRIS';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: BiometricType;
}

export interface BiometricCapabilities {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: BiometricType[];
  hardwareLevel: number;
}

/**
 * Biometric Authentication Service
 * Handles Face ID, Touch ID, and other biometric authentication
 */
class BiometricService {
  private capabilities: BiometricCapabilities | null = null;

  /**
   * Check if biometric authentication is available on device
   */
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('[BiometricService] Failed to check availability:', error);
      return false;
    }
  }

  /**
   * Get device biometric capabilities
   */
  async getCapabilities(): Promise<BiometricCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    try {
      const [hasHardware, isEnrolled, supportedTypes, securityLevel] =
        await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
          LocalAuthentication.supportedAuthenticationTypesAsync(),
          LocalAuthentication.getEnrolledLevelAsync(),
        ]);

      const mappedTypes = supportedTypes.map((type) => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'FINGERPRINT' as BiometricType;
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'FACIAL_RECOGNITION' as BiometricType;
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'IRIS' as BiometricType;
          default:
            return 'FINGERPRINT' as BiometricType;
        }
      });

      this.capabilities = {
        isAvailable: hasHardware && isEnrolled,
        isEnrolled,
        supportedTypes: mappedTypes,
        hardwareLevel: securityLevel,
      };

      return this.capabilities;
    } catch (error) {
      console.error('[BiometricService] Failed to get capabilities:', error);

      // Return default capabilities on error
      return {
        isAvailable: false,
        isEnrolled: false,
        supportedTypes: [],
        hardwareLevel: 0,
      };
    }
  }

  /**
   * Get biometric authentication prompt text based on platform
   */
  private getPromptText(): string {
    if (Platform.OS === 'ios') {
      return 'Authenticate to access Repo Nexus';
    }
    return 'Use biometrics to unlock';
  }

  /**
   * Get cancel button text based on platform
   */
  private getCancelText(): string {
    return Platform.OS === 'ios' ? 'Cancel' : 'Use passcode';
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(
    promptMessage?: string,
    cancelLabel?: string
  ): Promise<BiometricAuthResult> {
    try {
      // Check if biometric is available
      const available = await this.isAvailable();

      if (!available) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      // Get capabilities
      const capabilities = await this.getCapabilities();

      // Perform authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || this.getPromptText(),
        cancelLabel: cancelLabel || this.getCancelText(),
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return {
          success: true,
          biometricType: capabilities.supportedTypes[0],
        };
      }

      // Handle error cases
      let errorMessage = 'Authentication failed';

      if (result.error === 'user_cancel') {
        errorMessage = 'Authentication cancelled by user';
      } else if (result.error === 'lockout') {
        errorMessage = 'Too many failed attempts. Please try again later';
      } else if (result.error === 'not_enrolled') {
        errorMessage = 'No biometrics enrolled on this device';
      } else if (result.error === 'system_cancel') {
        errorMessage = 'Authentication cancelled by system';
      }

      return {
        success: false,
        error: errorMessage,
      };
    } catch (error) {
      console.error('[BiometricService] Authentication failed:', error);
      return {
        success: false,
        error: 'Biometric authentication error occurred',
      };
    }
  }

  /**
   * Check if biometric authentication is enabled in app settings
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStorageService.getItem(
        STORAGE_KEYS.BIOMETRIC_ENABLED
      );
      return enabled === 'true';
    } catch (error) {
      console.error('[BiometricService] Failed to check biometric setting:', error);
      return false;
    }
  }

  /**
   * Enable biometric authentication for the app
   */
  async enableBiometric(): Promise<boolean> {
    try {
      // Check if biometric is available
      const available = await this.isAvailable();

      if (!available) {
        throw new Error('Biometric authentication is not available');
      }

      // Test authentication before enabling
      const result = await this.authenticate('Verify your identity to enable biometrics');

      if (!result.success) {
        return false;
      }

      // Save preference
      await SecureStorageService.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');

      if (__DEV__) {
        console.log('[BiometricService] Biometric authentication enabled');
      }

      return true;
    } catch (error) {
      console.error('[BiometricService] Failed to enable biometric:', error);
      return false;
    }
  }

  /**
   * Disable biometric authentication for the app
   */
  async disableBiometric(): Promise<void> {
    try {
      await SecureStorageService.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'false');

      if (__DEV__) {
        console.log('[BiometricService] Biometric authentication disabled');
      }
    } catch (error) {
      console.error('[BiometricService] Failed to disable biometric:', error);
      throw error;
    }
  }

  /**
   * Get friendly name for biometric type
   */
  getBiometricTypeName(type?: BiometricType): string {
    if (!type) {
      return 'Biometrics';
    }

    switch (type) {
      case 'FACIAL_RECOGNITION':
        return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      case 'FINGERPRINT':
        return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      case 'IRIS':
        return 'Iris Scanner';
      default:
        return 'Biometrics';
    }
  }

  /**
   * Check if device supports Face ID (iOS only)
   */
  async supportsFaceID(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    const capabilities = await this.getCapabilities();
    return capabilities.supportedTypes.includes('FACIAL_RECOGNITION');
  }

  /**
   * Check if device supports Touch ID / Fingerprint
   */
  async supportsFingerprint(): Promise<boolean> {
    const capabilities = await this.getCapabilities();
    return capabilities.supportedTypes.includes('FINGERPRINT');
  }

  /**
   * Authenticate with optional retry logic
   */
  async authenticateWithRetry(
    maxRetries: number = 3,
    promptMessage?: string
  ): Promise<BiometricAuthResult> {
    let attempts = 0;

    while (attempts < maxRetries) {
      const result = await this.authenticate(promptMessage);

      if (result.success) {
        return result;
      }

      // Don't retry if user cancelled
      if (result.error?.includes('cancelled')) {
        return result;
      }

      attempts++;

      // Wait a bit before retry
      if (attempts < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return {
      success: false,
      error: 'Maximum authentication attempts reached',
    };
  }
}

// Export singleton instance
export const biometricService = new BiometricService();
export default biometricService;
