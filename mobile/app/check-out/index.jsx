import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { Button, TextInput, Text, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getItemAsync } from 'expo-secure-store'; // Only for native
import { jwtDecode } from 'jwt-decode';
import API_BASE_URL from '../../config/api';

const CheckOutScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const { tripId, vehicleId } = useLocalSearchParams();

  const [endOdometer, setEndOdometer] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [driverId, setDriverId] = useState(null);

  const getToken = async () => {
    if (Platform.OS === 'web') {
      return localStorage.getItem('token');
    } else {
      return await getItemAsync('token');
    }
  };

  useEffect(() => {
    const loadDriverId = async () => {
      try {
        const token = await getToken();
        if (!token) {
          Alert.alert("Auth Error", "No token found.");
          return;
        }

        const decoded = jwtDecode(token);
        setDriverId(decoded.id);
      } catch (error) {
        console.error("Token decode error:", error);
        Alert.alert("Auth Error", "Failed to get user identity.");
      }
    };

    loadDriverId();
  }, []);

  // const handleCheckOut = async () => {
  //   if (!endOdometer || !endLocation) {
  //     Alert.alert("Missing Fields", "Please fill all fields before checking out.");
  //     return;
  //   }

  //   try {
  //     const token = await getToken();
  //     if (!token) {
  //       Alert.alert("Auth Error", "No token found.");
  //       return;
  //     }

  //     // const response = await fetch(`${API_BASE_URL}/api/mobile/driver/checkout`, {
  //     const response = await fetch(`http://localhost:5000/api/mobile/driver/checkout`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({
  //         tripId,
  //         vehicleId,
  //         driverId,
  //         performedById: driverId,
  //         performedByRole: "driver",
  //         endOdometer: parseInt(endOdometer),
  //         endLocation,
  //       }),
  //     });

  //     if (response.ok) {
  //       await response.json();
  //       router.push('/dashboard');
  //     } else {
  //       const errData = await response.text();
  //       console.error("Check-out failed:", errData);
  //       Alert.alert("Error", "Could not complete check-out.");
  //     }
  //   } catch (err) {
  //     console.error("Checkout error:", err);
  //     Alert.alert("Error", "Something went wrong.");
  //   }
  // };
const handleCheckOut = async () => {
  if (!endOdometer || !endLocation) {
    Alert.alert("Missing Fields", "Please fill all fields before checking out.");
    return;
  }

  try {
    const token = await getToken();
    if (!token) {
      Alert.alert("Auth Error", "No token found.");
      return;
    }

    const decoded = jwtDecode(token);
    const role = decoded.role;

    let url = '';
    let body = {
      tripId,
      vehicleId,
      endOdometer: parseInt(endOdometer),
      endLocation,
    };

    if (role === 'driver') {
      url = `${API_BASE_URL}/api/mobile/driver/checkout`;
      // performedById and performedByRole will be added server side as driver id from token
    } else if (role === 'supervisor') {
      url = `${API_BASE_URL}/api/mobile/supervisor/checkout`;
      body = {
        ...body,
        driverId, // this should be selected or passed as prop (the driver to checkout)
        performedByRole: 'supervisor',
        performedById: decoded.id,
      };
    } else {
      Alert.alert("Unauthorized", "You don't have permission to check out.");
      return;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      await response.json();
      router.push('/dashboard');
    } else {
      const errData = await response.text();
      console.error("Check-out failed:", errData);
      Alert.alert("Error", "Could not complete check-out.");
    }
  } catch (err) {
    console.error("Checkout error:", err);
    Alert.alert("Error", "Something went wrong.");
  }
};

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>Vehicle Check-Out</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Complete your trip and return the vehicle</Text>

      <TextInput
        label="Ending Odometer Reading"
        value={endOdometer}
        onChangeText={setEndOdometer}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
      />

      <TextInput
        label="Ending Location"
        value={endLocation}
        onChangeText={setEndLocation}
        style={styles.input}
        mode="outlined"
      />

      <View style={styles.buttonContainer}>
        <Button mode="outlined" onPress={() => router.back()} style={styles.button}>
          Cancel
        </Button>
        <Button mode="contained" onPress={handleCheckOut} style={styles.button}>
          Check Out
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { marginBottom: 5, fontWeight: 'bold' },
  subtitle: { marginBottom: 20, color: '#666' },
  input: { marginBottom: 15 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, marginHorizontal: 5 },
});

export default CheckOutScreen;