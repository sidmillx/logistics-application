import { Tabs } from 'expo-router';
import { Car, LayoutDashboard, Users } from 'lucide-react-native';

export default function SupervisorLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00204D',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <LayoutDashboard size={24} color={focused ? '#00204D' : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles/index"
        options={{
          title: 'Vehicles',
          tabBarIcon: ({ color, focused }) => (
            <Car size={24} color={focused ? '#00204D' : color} />
          ),

        }}
      />
      <Tabs.Screen
        name="drivers/index"
        options={{
          title: 'Drivers',
          tabBarIcon: ({ color, focused }) => (
            <Users size={24} color={focused ? '#00204D' : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicle-details/[vehicle]"
        options={{
           title: 'Vehicle details',
           href: null,
        }}
      />
    </Tabs>
  );
}