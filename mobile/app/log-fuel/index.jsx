import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { Button, TextInput, Text, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getItemAsync } from 'expo-secure-store'; // Only for native
import { jwtDecode } from 'jwt-decode';
import API_BASE_URL from '../../config/api';

const LogFuelScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const { tripId, vehicleId } = useLocalSearchParams();

  const [litresAdded, setLitresAdded] = useState('');
  const [cost, setCost] = useState('');
  const [odometer, setOdometer] = useState('');
  const [fuelLocation, setFuelLocation] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [driverId, setDriverId] = useState(null);

  useEffect(() => {
    const getUserIdFromToken = async () => {
      try {
        let token;
        if (Platform.OS === 'web') {
          // Use localStorage for web
          token = localStorage.getItem('token');
        } else {
          // Use expo-secure-store for native platforms
          token = await getItemAsync('token');
        }

        console.log("Retrieved token:", token);
        if (!token) return Alert.alert("Error", "Authentication token not found");

        const decoded = jwtDecode(token);
        if (!decoded?.id) throw new Error("Invalid token payload");

        setDriverId(decoded.id);
      } catch (err) {
        console.error("Token decoding failed:", err);
        Alert.alert("Error", "Failed to retrieve user identity.");
      }
    };

    getUserIdFromToken();
  }, []);

  const handleSave = async () => {
    if (!litresAdded || !cost || !odometer || !fuelLocation || !paymentRef) {
      Alert.alert("Missing Fields", "Please complete all fields.");
      return;
    }

    if (!driverId) {
      Alert.alert("Authentication Error", "Driver ID is missing.");
      return;
    }

    try {
      let token;
      if (Platform.OS === 'web') {
        token = localStorage.getItem('token');
      } else {
        token = await getItemAsync('token');
      }

      const response = await fetch(`${API_BASE_URL}/api/mobile/driver/fuel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleId,
          tripId,
          litres: parseFloat(litresAdded),
          cost: parseFloat(cost),
          odometer: parseFloat(odometer),
          location: fuelLocation,
          paymentReference: paymentRef,
          loggedBy: driverId,
        }),
      });

      if (response.ok) {
        await response.json();
        router.push('/dashboard');
      } else {
        const errData = await response.text();
        console.error("Fuel log failed:", errData);
        Alert.alert("Error", "Could not save fuel log.");
      }
    } catch (err) {
      console.error("Fuel log fetch error:", err);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>Log Fuel Entry</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Record fuel added to the vehicle</Text>

      <TextInput label="Litres Added" value={litresAdded} onChangeText={setLitresAdded} style={styles.input} mode="outlined" keyboardType="numeric" />
      <TextInput label="Cost" value={cost} onChangeText={setCost} style={styles.input} mode="outlined" keyboardType="numeric" />
      <TextInput label="Odometer at Fueling" value={odometer} onChangeText={setOdometer} style={styles.input} mode="outlined" keyboardType="numeric" />
      <TextInput label="Fuel Location" value={fuelLocation} onChangeText={setFuelLocation} style={styles.input} mode="outlined" />

      <Button mode="outlined" onPress={() => {/* Upload logic */}} style={styles.uploadButton} icon="camera">
        Upload Receipt
      </Button>

      <TextInput label="Payment Reference" value={paymentRef} onChangeText={setPaymentRef} style={styles.input} mode="outlined" />

      <View style={styles.buttonContainer}>
        <Button mode="outlined" onPress={() => router.back()} style={styles.button}>Cancel</Button>
        <Button mode="contained" onPress={handleSave} style={styles.button}>Save</Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { marginBottom: 5, fontWeight: 'bold' },
  subtitle: { marginBottom: 20, color: '#666' },
  input: { marginBottom: 15 },
  uploadButton: { marginBottom: 10 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, marginHorizontal: 5 },
});

export default LogFuelScreen;