import { Stack, useRouter } from 'expo-router';
import { Alert, TouchableOpacity, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react-native';
import { Button } from 'react-native-paper';

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
    headerBackVisible: false,
    headerTransparent: false,
    headerStatusBarHeight: 0,
    headerStyle: {
      backgroundColor: '#fff',
      elevation: 0,         // Android shadow removal
      shadowOpacity: 0,     // iOS shadow removal
      height: 60,           // 👈 manually control header height
    },
    headerLeft: () => null,
    title: '',
    headerRight: () => (
      <Button
        mode="contained"
        icon="logout"
        onPress={handleLogout}
        buttonColor="#EF4444"
        textColor="#fff"
        style={{ marginRight: 10, borderRadius: 8 }}
        labelStyle={{ fontWeight: '600' }}
      >
        Logout
      </Button>
    ),
  }}
/>


  );
}
