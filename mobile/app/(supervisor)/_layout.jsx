import { Tabs } from 'expo-router';
import { Car, LayoutDashboard, Users, LogOut } from 'lucide-react-native';
import { TouchableOpacity, Text, View, Platform, Alert } from 'react-native';
import { clearAll } from '../../utils/storage'; // adjust path if needed
import { router } from 'expo-router';

export default function SupervisorLayout() {
  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to logout?');
      if (confirmLogout) {
        await clearAll();
        router.replace('/login'); // redirect to login page
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearAll();
            router.replace('/login'); // redirect to login page
          },
        },
      ]);
    }
  };

  return (
    <Tabs
  screenOptions={{
    tabBarActiveTintColor: '#00204D',
    tabBarInactiveTintColor: 'gray',
    tabBarStyle: { paddingBottom: 5, height: 60 },
    headerShown: true,
    headerTransparent: false,
    headerStyle: {
      backgroundColor: '#fff',
      elevation: 0,         // Android shadow removal
      shadowOpacity: 0,     // iOS shadow removal
      height: 60,           // 👈 manually control header height
    },
    headerStatusBarHeight: 0, // 👈 removes that white safe area gap
    headerTitle: '',
    headerRight: () => (
      <TouchableOpacity
        style={{
          marginRight: 15,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        onPress={handleLogout}
      >
        <LogOut size={22} color="#00204D" />
        <Text style={{ color: '#00204D', marginLeft: 5, fontWeight: '600' }}>
          Logout
        </Text>
      </TouchableOpacity>
    ),
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
          title: 'Vehicle Details',
          href: null, // hidden from tab bar
        }}
      />
    </Tabs>
  );
}
