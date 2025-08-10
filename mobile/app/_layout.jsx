import { Stack } from "expo-router";
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Platform, StatusBar } from 'react-native';
import customTheme from '../config/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={customTheme}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <Stack initialRouteName="login/index">
            <Stack.Screen name="login/index" options={{ headerShown: false }}/>
            <Stack.Screen name="(driver)" options={{ headerShown: false }} />
            <Stack.Screen name="(supervisor)" options={{ headerShown: false }} />
            <Stack.Screen name="vehicles/index" options={{ title: 'Vehicle Fleet' }} />
            <Stack.Screen name="drivers/index" options={{ title: 'Drivers' }} />
            <Stack.Screen name="assign-driver/[vehicle]" options={{ title: 'Assign Driver' }} />
            <Stack.Screen name="vehicle-details/[vehicle]" options={{ title: 'Vehicle Details' }} />
            <Stack.Screen name="check-in/index" options={{ title: 'Vehicle Check-In' }} />
            <Stack.Screen name="log-fuel/index" options={{ title: 'Log Fuel' }} />
            <Stack.Screen name="check-out/index" options={{ title: 'Vehicle Check-Out' }} />
          </Stack>
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
