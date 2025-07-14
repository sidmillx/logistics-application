import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { Button, TextInput, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../config/api';

const CheckInScreen = () => {
  const router = useRouter();
  const theme = useTheme();

  const [assignedVehicle, setAssignedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tripPurpose, setTripPurpose] = useState('');
  const [startOdometer, setStartOdometer] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  const getToken = async () => {
    return Platform.OS === 'web'
      ? localStorage.getItem('token')
      : await AsyncStorage.getItem('token');
  };

  useEffect(() => {
    const loadUserAndVehicle = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        const token = await getToken();

        if (!userStr || !token) {
          Alert.alert("Auth Error", "User not authenticated");
          router.replace("/");
          return;
        }

        const user = JSON.parse(userStr);
        setUserInfo(user);
        console.log("Loaded user:", user);

        const res = await fetch(`${API_BASE_URL}/api/mobile/driver/assignment`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        console.log("Loaded assigned vehicle:", data);

        if (data.message === "No assignment found") {
          setAssignedVehicle(null);
        } else {
          setAssignedVehicle(data); // includes driverId and vehicleId
        }
      } catch (err) {
        console.error("Error loading data:", err);
        Alert.alert("Error", "Failed to load user or assignment");
      } finally {
        setLoading(false);
      }
    };

    loadUserAndVehicle();
  }, []);

  const handleCheckIn = async () => {
    if (!tripPurpose || !startOdometer || !startLocation) {
      Alert.alert("Missing Fields", "Please fill all fields before checking in.");
      return;
    }

    if (!userInfo || !assignedVehicle) {
      Alert.alert("Error", "Missing user or vehicle information.");
      return;
    }

    const token = await getToken();

    try {
      const payload = {
        vehicleId: assignedVehicle.vehicleId,
        driverId: assignedVehicle.driverId || userInfo.id,
        performedById: userInfo.id,
        performedByRole: userInfo.role,
        startOdometer: parseInt(startOdometer),
        startLocation,
        tripPurpose,
      };

      console.log("Check-in payload:", payload);

      const response = await fetch(`${API_BASE_URL}/api/mobile/driver/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Check-in successful:", data);
        router.back();
      } else {
        const errData = await response.json();
        console.error("Check-in error:", errData);
        Alert.alert("Error", "Check-in failed.");
      }
    } catch (err) {
      console.error("Check-in fetch error:", err);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>Vehicle Check-in</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Enter trip details</Text>

      {loading ? (
        <ActivityIndicator animating={true} />
      ) : assignedVehicle ? (
        <TextInput
        label="Assigned Vehicle"
        value={assignedVehicle.plateNumber || ''}
        style={styles.input}
        mode="outlined"
        editable={false}
      />

      ) : (
        <TextInput
          label="Assigned Vehicle"
          value="No vehicle assigned"
          style={styles.input}
          mode="outlined"
          editable={false}
        />
      )}

      <TextInput
        label="Trip Purpose"
        value={tripPurpose}
        onChangeText={setTripPurpose}
        style={styles.input}
        mode="outlined"
      />

      <TextInput
        label="Starting Odometer Reading"
        value={startOdometer}
        onChangeText={setStartOdometer}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
      />

      <TextInput
        label="Starting Location"
        value={startLocation}
        onChangeText={setStartLocation}
        style={styles.input}
        mode="outlined"
      />

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.button}
        >
          Cancel
        </Button>

        <Button
          mode="contained"
          onPress={handleCheckIn}
          style={styles.button}
        >
          Check in
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

export default CheckInScreen;
