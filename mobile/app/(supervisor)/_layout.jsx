import { Tabs, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function SupervisorLayout() {
  const router = useRouter();
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="dashboard" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Vehicles',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="directions-car" size={24} color={color} />
          ),
        }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            router.push('/vehicles');
          },
        })}
      />
      <Tabs.Screen
        name="drivers"
        options={{
          title: 'Drivers',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="people" size={24} color={color} />
          ),
        }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            router.push('/drivers');
          },
        })}
      />
    </Tabs>
  );
}