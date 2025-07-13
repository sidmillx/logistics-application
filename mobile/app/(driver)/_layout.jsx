import { Tabs, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabsLayout() {
  const router = useRouter();

  // This function will be triggered when Logout tab is pressed
  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <Tabs>
        <Tabs.Screen
        name="logout"
        options={{
          title: 'Logout',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="logout" size={24} color={color} />
          ),
          // Hide header and trigger logout immediately
          href: null,
          tabBarButton: (props) => (
            <MaterialIcons.Button
              name="logout"
              backgroundColor="transparent"
              color={props.accessibilityState.selected ? "#6200ee" : "#222"}
              onPress={handleLogout}
              iconStyle={{ marginRight: 0 }}
            >
              Logout
            </MaterialIcons.Button>
          ),
        }}
      />
    </Tabs>
  );
}
