import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Card, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';

const DashboardScreen = () => {
  const theme = useTheme();

  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const driverName = "John Dlamini"; // Replace with auth later

  useEffect(() => {
    const fetchActiveTrip = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/mobile/driver/active-trip");
        const data = await res.json();

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
      }
    };

    fetchActiveTrip();
  }, []);

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
          onPress={() => {/* Logout logic */}}
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
        {console.log("Navigating to checkout with:", {
          tripId: tripData.tripId,
          vehicleId: tripData.vehicleId,
          driverId: tripData.driverId,
        })
        }

      <Button
        mode="outlined"
        onPress={() => router.push({ pathname: '/check-out', params: { tripId: tripData.tripId, vehicleId: tripData.vehicleId, driverId: tripData.driverId } })}
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
