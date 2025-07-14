import { Stack } from "expo-router";
import { PaperProvider } from 'react-native-paper';
import customTheme from '../config/theme';

export default function RootLayout() {
  return (
    <PaperProvider theme={customTheme}>
      <Stack>

        {/* supervisor */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(driver)" options={{ headerShown: false }} />
        <Stack.Screen name="(supervisor)" options={{ headerShown: false }} />
        <Stack.Screen name="vehicles/index" options={{ title: 'Vehicle Fleet' }} />
        <Stack.Screen name="drivers/index" options={{ title: 'Drivers' }} />
        <Stack.Screen name="assign-driver/[vehicle]" options={{ title: 'Assign Driver' }} />
        <Stack.Screen name="vehicle-details/[vehicle]" options={{ title: 'Vehicle Details' }} />


        {/* driver */}
     
      
        <Stack.Screen 
          name="check-in/index" 
          options={{ title: 'Vehicle Check-In' }} 
        />
        <Stack.Screen 
          name="log-fuel/index" 
          options={{ title: 'Log Fuel' }} 
        />
        <Stack.Screen 
          name="check-out/index" 
          options={{ title: 'Vehicle Check-Out' }} 
          // options={{headerShown: false}} 
        />
      </Stack>
    </PaperProvider>
  );
}