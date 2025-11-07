import * as SecureStore from 'expo-secure-store';

/**
 * Secure storage wrapper for sensitive data
 */
export const SecureStorageService = {
  /**
   * Set a value in secure storage
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error setting secure item ${key}:`, error);
      throw error;
    }
  },

  /**
   * Get a value from secure storage
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error getting secure item ${key}:`, error);
      return null;
    }
  },

  /**
   * Delete a value from secure storage
   */
  deleteItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error deleting secure item ${key}:`, error);
      throw error;
    }
  },

  /**
   * Check if a key exists in secure storage
   */
  hasItem: async (key: string): Promise<boolean> => {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value !== null;
    } catch {
      return false;
    }
  },
};

export default SecureStorageService;
