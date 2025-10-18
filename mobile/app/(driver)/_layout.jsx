import { Stack, useRouter } from 'expo-router';
import { Alert, Platform , View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
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

  const confirmLogout = () => {
  if (Platform.OS === 'web') {
    // Web-compatible confirmation
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) handleLogout();
  } else {
    // Mobile (React Native) alert
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: handleLogout,
        },
      ],
      { cancelable: true }
    );
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
          height: 50,           // Reduced height
        },
        headerTitleStyle: {
          display: 'none',      // Completely remove title space
        },
        headerLeft: () => null,
        headerTitle: '',        // Empty title
        headerRight: () => (
          <Button
            mode="contained"
            icon="logout"
            onPress={confirmLogout}
            buttonColor="#EF4444"
            textColor="#fff"
            style={{ 
              marginRight: 10, 
              borderRadius: 8,
              marginVertical: 0, // Remove vertical margins
            }}
            contentStyle={{
              height: 36,        // Smaller button height
              marginVertical: 0, // Remove vertical padding
            }}
            labelStyle={{ 
              fontWeight: '600',
              fontSize: 14,      // Smaller font
              marginVertical: 0, // Remove label margins
            }}
          >
            Logout
          </Button>
        ),
      }}
    />
  );
}