import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, TextInput, Text, useTheme, ActivityIndicator } from 'react-native-paper';

const CheckInScreen = ({navigation}) => {

  const theme = useTheme();

  const [assignedVehicle, setAssignedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tripPurpose, setTripPurpose] = useState('');
  const [startOdometer, setStartOdometer] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [error, setError] = useState('');

   useEffect(() => {
    const fetchAssignedVehicle = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/mobile/driver/assignment");
        const data = await res.json();

        if (data.message === "No assignment found") {
          setAssignedVehicle(null);
        } else {
          setAssignedVehicle(data); // should contain driverId, vehicleId, optionally vehicle info
        }
      } catch (err) {
        console.error("Assignment fetch error:", err);
        setError("Failed to fetch assignment");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedVehicle();
  }, []);

  const handleCheckIn = async () => {
    
    if (!tripPurpose || !startOdometer || !startLocation) {
      Alert.alert("Missing Fields", "Please fill all fields before checking in.");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/mobile/driver/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          vehicleId: assignedVehicle.vehicleId,
          driverId: assignedVehicle.driverId,
          performedById: assignedVehicle.driverId,
          performedByRole: "driver",
          startOdometer: parseInt(startOdometer),
          startLocation,
          tripPurpose
        })
      });

      if (response.ok) {
        const data = await response.json();
        navigation.navigate("Dashboard");
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
          label="Assigned Vehicle ID"
          value={assignedVehicle.vehicleId}
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
          onPress={() => navigation.goBack()}
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
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 5,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 20,
    color: '#666',
  },
  input: {
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default CheckInScreen;