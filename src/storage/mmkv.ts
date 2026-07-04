import { StateStorage } from 'zustand/middleware';

interface MMKVIInstance {
  getString: (key: string) => string | null;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
}

let storage: MMKVIInstance;

try {
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV();
} catch (error) {
  const store = new Map<string, string>();
  storage = {
    getString: (key: string) => store.get(key) || null,
    set: (key: string, value: string) => {
      store.set(key, value);
    },
    delete: (key: string) => {
      store.delete(key);
    },
  };
}

export const mmkvStorage = {
  getString: (key: string): string | null => {
    return storage.getString(key);
  },
  
  set: (key: string, value: string): void => {
    storage.set(key, value);
  },
  
  delete: (key: string): void => {
    storage.delete(key);
  },
  
  getObject: <T>(key: string): T | null => {
    const raw = storage.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  
  setObject: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  }
};

// Zustand state storage adapter
export const zustandMMKVStorage: StateStorage = {
  getItem: (name) => {
    const value = mmkvStorage.getString(name);
    return value ?? null;
  },
  setItem: (name, value) => {
    mmkvStorage.set(name, value);
  },
  removeItem: (name) => {
    mmkvStorage.delete(name);
  },
};

// Custom storage interface for TanStack Query Persister
export const queryPersisterStorage = {
  getItem: (key: string) => {
    return mmkvStorage.getString(key);
  },
  setItem: (key: string, value: string) => {
    mmkvStorage.set(key, value);
  },
  removeItem: (key: string) => {
    mmkvStorage.delete(key);
  },
};
