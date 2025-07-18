import { Tabs } from 'expo-router';
import { Car, LayoutDashboard, Users } from 'lucide-react-native'

export default function SupervisorLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <LayoutDashboard  size={24} color={color} />
          ),
          href: '/',
        }}
      />
      <Tabs.Screen
        name="vehicles/index"
        options={{
          title: 'Vehicles',
          tabBarIcon: ({ color }) => (
            <Car size={24} color={color} />
          ),
          href: '/vehicles',
        }}
      />
      <Tabs.Screen
        name="drivers/index"
        options={{
          title: 'Drivers',
          tabBarIcon: ({ color }) => (
            <Users size={24} color={color} />
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