import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, TextInput, Text, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';

const LogFuelScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const { tripId, vehicleId } = useLocalSearchParams(); // receive from dashboard

  const [litresAdded, setLitresAdded] = useState('');
  const [cost, setCost] = useState('');
  const [odometer, setOdometer] = useState('');
  const [fuelLocation, setFuelLocation] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  const handleSave = async () => {
    if (!litresAdded || !cost || !odometer || !fuelLocation || !paymentRef) {
      Alert.alert("Missing Fields", "Please complete all fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/mobile/driver/fuel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleId,
          tripId,
          litres: parseInt(litresAdded),
          cost: parseInt(cost),
          odometer: parseInt(odometer),
          location: fuelLocation,
          paymentReference: paymentRef,
          loggedBy: '2368e66f-00c8-4e8e-8394-7662fa247306', // temp hardcoded
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push('/dashboard'); // or navigate back
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

      <TextInput
        label="Litres Added"
        value={litresAdded}
        onChangeText={setLitresAdded}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
      />

      <TextInput
        label="Cost"
        value={cost}
        onChangeText={setCost}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
      />

      <TextInput
        label="Odometer at Fueling"
        value={odometer}
        onChangeText={setOdometer}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
      />

      <TextInput
        label="Fuel Location"
        value={fuelLocation}
        onChangeText={setFuelLocation}
        style={styles.input}
        mode="outlined"
      />

        <Button 
        mode="outlined" 
        onPress={() => {/* Upload receipt logic */}}
        style={styles.uploadButton}
        icon="camera"
      >
        Upload Receipt
      </Button>

      <TextInput
        label="Payment Reference"
        value={paymentRef}
        onChangeText={setPaymentRef}
        style={styles.input}
        mode="outlined"
      />

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
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, marginHorizontal: 5 },
});

export default LogFuelScreen;
