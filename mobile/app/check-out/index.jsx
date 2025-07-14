import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { Button, TextInput, Text, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getItemAsync } from 'expo-secure-store'; // Native secure storage
import { jwtDecode } from 'jwt-decode';
import API_BASE_URL from '../../config/api';

const CheckOutScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const { tripId, vehicleId, driverId: routeDriverId } = useLocalSearchParams();

  const [endOdometer, setEndOdometer] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  const getToken = async () => {
    if (Platform.OS === 'web') {
      return localStorage.getItem('token');
    } else {
      return await getItemAsync('token');
    }
  };

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const token = await getToken();
        if (!token) {
          Alert.alert("Auth Error", "No token found.");
          return;
        }

        const decoded = jwtDecode(token);
        setUserInfo({ id: decoded.id, role: decoded.role });
      } catch (error) {
        console.error("Token decode error:", error);
        Alert.alert("Auth Error", "Failed to decode user info.");
      }
    };

    loadUserInfo();
  }, []);

  const handleCheckOut = async () => {
    if (!endOdometer || !endLocation) {
      Alert.alert("Missing Fields", "Please fill all fields before checking out.");
      return;
    }

    if (!userInfo || !tripId || !vehicleId) {
      Alert.alert("Missing Info", "User, trip or vehicle ID is missing.");
      return;
    }

    const token = await getToken();
    const isSupervisor = userInfo.role === "supervisor";

    const body = {
      tripId,
      vehicleId,
      driverId: isSupervisor ? routeDriverId : userInfo.id, // driver being checked out
      performedById: userInfo.id,
      performedByRole: userInfo.role,
      endOdometer: parseInt(endOdometer),
      endLocation
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/driver/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await response.json();
        router.push('/dashboard');
      } else {
        const errText = await response.text();
        console.error("Check-out failed:", errText);
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
