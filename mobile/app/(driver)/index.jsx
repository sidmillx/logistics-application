import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Card, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from "../../config/api";

const DashboardScreen = () => {
  const theme = useTheme();

  const [tripData, setTripData] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverName, setDriverName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userString = await AsyncStorage.getItem('user');

        if (!token || !userString) {
          router.replace('/'); // Redirect to login
          return;
        }

        const user = JSON.parse(userString);
        setDriverName(user.fullname || user.username || '');

        // Fetch active trip
        const tripRes = await fetch(`${API_BASE_URL}/api/mobile/driver/active-trip`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const tripJson = await tripRes.json();
        if (tripRes.ok && tripJson?.tripId) {
          setTripData(tripJson); // ✅ Active trip takes priority
        } else {
          // No active trip, fetch assignment
          const assignmentRes = await fetch(`${API_BASE_URL}/api/mobile/driver/assignment`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const assignmentJson = await assignmentRes.json();
          if (assignmentJson?.vehicleId) {
            setAssignment(assignmentJson); // ✅ Assigned but not yet checked in
          }
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
        Alert.alert("Error", "Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.welcomeText}>
        Welcome {driverName}, to your dashboard
      </Text>

      {tripData ? (
        <>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitle}>Active Trip</Text>
              <View style={styles.vehicleInfo}>
                <Text style={styles.label}>Vehicle</Text>
                <Text style={styles.value}>{tripData.plateNumber}</Text>
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.label}>Make/Model</Text>
                <Text style={styles.value}>{tripData.make} {tripData.model}</Text>
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.label}>Purpose</Text>
                <Text style={styles.value}>{tripData.purpose}</Text>
              </View>
              <View style={styles.tripInfo}>
                <Text>✓ Started {new Date(tripData.checkInTime).toLocaleString()}</Text>
                <Text>✓ {tripData.locationStart}</Text>
                <Text>✓ Start Odometer: {tripData.odometerStart} km</Text>
              </View>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={() => router.push({
              pathname: '/log-fuel',
              params: {
                tripId: tripData.tripId,
                vehicleId: tripData.vehicleId,
              }
            })}
            style={styles.button}
          >
            Log Fuel
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.push({
              pathname: '/check-out',
              params: {
                tripId: tripData.tripId,
                vehicleId: tripData.vehicleId,
                driverId: tripData.driverId
              }
            })}
            style={styles.button}
          >
            Check Out Vehicle
          </Button>
        </>
      ) : assignment ? (
        <>
        <Card style={styles.card}>
  <Card.Content>
    <Text variant="titleLarge" style={styles.cardTitle}>
      Vehicle Assignment
    </Text>

    <View style={styles.vehicleInfo}>
      <Text style={styles.label}>Plate Number:</Text>
      <Text style={styles.value}>{assignment?.plateNumber}</Text>
    </View>

    <View style={styles.vehicleInfo}>
      <Text style={styles.label}>Make/Model:</Text>
      <Text style={styles.value}>{assignment?.make} {assignment?.model}</Text>
    </View>

    <View style={styles.vehicleInfo}>
      <Text style={styles.label}>Assigned At:</Text>
      <Text style={styles.value}>
        {new Date(assignment?.assignedAt).toLocaleDateString()}
      </Text>
    </View>
  </Card.Content>
</Card>

<Button
  mode="contained"
  onPress={() => router.push('/check-in')}
  style={styles.button}
>
  Check In Vehicle
</Button>

        </>
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>Vehicle Status</Text>
            <Text variant="bodyMedium" style={styles.cardText}>No Vehicle Assignment</Text>
          </Card.Content>
        </Card>
      )}

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.button}
      >
        Logout
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  welcomeText: { marginBottom: 20, fontWeight: 'bold' },
  card: { marginBottom: 20 },
  cardTitle: { marginBottom: 15, fontWeight: 'bold' },
  cardText: { marginBottom: 10 },
  vehicleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: { fontWeight: 'bold' },
  value: { flex: 1, textAlign: 'right' },
  tripInfo: { marginTop: 15 },
  button: { marginTop: 10, paddingVertical: 5 },
});

export default DashboardScreen;
