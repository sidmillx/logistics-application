import { Stack, useRouter } from 'expo-router';
import { Alert, TouchableOpacity, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react-native';

export default function CustomStackLayout() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        router.replace('/login');
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await AsyncStorage.multiRemove(['user', 'token']);
      router.replace('/login');
    } catch (error) {
      console.error('[LOGOUT] Error:', error);
      Alert.alert('Error', 'Logout failed. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoggingOut) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Logging out...</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerRight: () => (
          <TouchableOpacity
            onPress={handleLogout}
            style={{ marginRight: 15 }}
          >
            <LogOut size={24} color="#222" />
          </TouchableOpacity>
        ),
      }}
    />
  );
}
