import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function SupervisorLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="dashboard" size={24} color={color} />
          ),
          href: '/',
        }}
      />
      <Tabs.Screen
        name="vehicles/index"
        options={{
          title: 'Vehicles',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="directions-car" size={24} color={color} />
          ),
          href: '/vehicles',
        }}
      />
      <Tabs.Screen
        name="drivers/index"
        options={{
          title: 'Drivers',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="people" size={24} color={color} />
          ),
          href: '/drivers',
        }}
      />
      {/* Explicitly hide the vehicle-details route */}
      <Tabs.Screen
        name="vehicle-details/index"
        options={{
          href: null, // This will hide it from tabs
        }}
      />
    </Tabs>
  );
}