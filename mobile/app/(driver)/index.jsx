import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Card, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from "../../config/api";

const DashboardScreen = () => {
  const theme = useTheme();

  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true); // Dashboard loading
  const [authLoading, setAuthLoading] = useState(true); // Auth check loading
  const [driverName, setDriverName] = useState('');

  useEffect(() => {
    const fetchActiveTrip = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userString = await AsyncStorage.getItem('user');

        if (!token || !userString) {
          router.replace('/'); // ⛔ Redirect only after confirming null
          return;
        }

        const user = JSON.parse(userString);
        setDriverName(user.fullname || user.username || '');

        const res = await fetch(`${API_BASE_URL}/api/mobile/driver/active-trip`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("API error:", data.message);
          Alert.alert("Error", data.message || "Unable to load data.");
          return;
        }

        if (data.message === "No active trip") {
          setTripData(null);
        } else {
          setTripData(data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard trip data", err);
        Alert.alert("Error", "Could not load dashboard data.");
      } finally {
        setLoading(false);
        setAuthLoading(false); // ✅ Finished checking auth
      }
    };

    fetchActiveTrip();
  }, []);

  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!tripData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineSmall" style={styles.welcomeText}>
          Welcome {driverName}, to your dashboard
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Vehicle Status
            </Text>
            <Text variant="bodyMedium" style={styles.cardText}>
              No Active Vehicle Assignment
            </Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={() => router.push('/check-in')}
          style={styles.button}
        >
          Check In Vehicle
        </Button>

        <Button
          mode="outlined"
          onPress={async () => {
            await AsyncStorage.clear();
            router.replace('/');
          }}
          style={styles.button}
        >
          Logout
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.welcomeText}>
        Welcome {driverName}, to your dashboard
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Vehicle Status
          </Text>

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
            <Text>✓ Started {new Date(tripData.checkInTime).toLocaleDateString()}</Text>
            <Text>✓ {tripData.locationStart}</Text>
            <Text>✓ Start Odometer: {tripData.odometerStart} km</Text>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={() =>
          router.push({
            pathname: '/log-fuel',
            params: {
              tripId: tripData.tripId,
              vehicleId: tripData.vehicleId,
            }
          })
        }
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 20,
  },
  cardTitle: {
    marginBottom: 15,
    fontWeight: 'bold',
  },
  cardText: {
    marginBottom: 10,
  },
  vehicleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
  tripInfo: {
    marginTop: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
});

export default DashboardScreen;
