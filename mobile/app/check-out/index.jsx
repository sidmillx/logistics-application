import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, TextInput, Text, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';

const CheckOutScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const { tripId, vehicleId, driverId } = useLocalSearchParams();

  useEffect(() => {
  console.log("CheckOut Params:", { tripId, vehicleId, driverId });
}, []);

  const [endOdometer, setEndOdometer] = useState('');
  const [endLocation, setEndLocation] = useState('');

 const handleCheckOut = async () => {
  if (!endOdometer || !endLocation) {
    Alert.alert("Missing Fields", "Please fill all fields before checking out.");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/mobile/driver/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tripId,
        vehicleId,
        driverId,
        performedById: driverId,
        performedByRole: "driver",
        endOdometer: parseInt(endOdometer),
        endLocation
      })
    });

    if (response.ok) {
      const data = await response.json();
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
