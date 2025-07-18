// utils/storage.js
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveItem = async (key, value) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
};

export const getItem = async (key) => {
  return Platform.OS === 'web'
    ? localStorage.getItem(key)
    : await AsyncStorage.getItem(key);
};

export const clearAll = async () => {
  if (Platform.OS === 'web') {
    localStorage.clear();
    sessionStorage.clear();
  } else {
    await AsyncStorage.clear();
  }
};
