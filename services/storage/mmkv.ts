import { MMKV } from 'react-native-mmkv';

// Initialize MMKV instance
export const storage = new MMKV({
  id: 'repo-nexus-storage',
  encryptionKey: 'repo-nexus-encryption-key', // TODO: Use secure key generation
});

/**
 * Storage wrapper with type-safe methods
 */
export const StorageService = {
  /**
   * Set a string value
   */
  setString: (key: string, value: string): void => {
    storage.set(key, value);
  },

  /**
   * Get a string value
   */
  getString: (key: string): string | undefined => {
    return storage.getString(key);
  },

  /**
   * Set a number value
   */
  setNumber: (key: string, value: number): void => {
    storage.set(key, value);
  },

  /**
   * Get a number value
   */
  getNumber: (key: string): number | undefined => {
    return storage.getNumber(key);
  },

  /**
   * Set a boolean value
   */
  setBoolean: (key: string, value: boolean): void => {
    storage.set(key, value);
  },

  /**
   * Get a boolean value
   */
  getBoolean: (key: string): boolean | undefined => {
    return storage.getBoolean(key);
  },

  /**
   * Set an object value (JSON serialized)
   */
  setObject: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },

  /**
   * Get an object value (JSON deserialized)
   */
  getObject: <T>(key: string): T | undefined => {
    const value = storage.getString(key);
    if (!value) return undefined;
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  },

  /**
   * Delete a value
   */
  delete: (key: string): void => {
    storage.delete(key);
  },

  /**
   * Check if a key exists
   */
  contains: (key: string): boolean => {
    return storage.contains(key);
  },

  /**
   * Get all keys
   */
  getAllKeys: (): string[] => {
    return storage.getAllKeys();
  },

  /**
   * Clear all storage
   */
  clearAll: (): void => {
    storage.clearAll();
  },
};

export default StorageService;
