import { Tabs, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Alert, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export default function TabsLayout() {
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            console.log('Storage cleared, navigating to root');
            router.replace('/'); // Navigate to root (assumed auth screen)
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to log out. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 60,
          alignItems: 'center',
        },
        headerRight: () => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLogout}
            style={{ marginRight: 15 }}
          >
            <MaterialIcons name="logout" size={24} color="#222" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: true, // Show header to include logout button
          title: 'Home', // Optional: Set a title for the tab
        }}
      />
      {/* Add more screens if needed, e.g., */}
      {/* <Tabs.Screen
        name="profile"
        options={{
          headerShown: true,
          title: 'Profile',
        }}
      /> */}
    </Tabs>
  );
}