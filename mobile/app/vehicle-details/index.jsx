import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, Alert } from 'react-native';
import { Button, Card, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { getItemAsync } from 'expo-secure-store';
import API_BASE_URL from '../../config/api';

export default function VehicleDetails() {
  const { vehicleId, vehicleName } = useLocalSearchParams();
  console.log(vehicleId, vehicleName);
  const theme = useTheme();

  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const getToken = async () => {
    return Platform.OS === 'web'
      ? localStorage.getItem('token')
      : await getItemAsync('token');
  };

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        const token = await getToken();
        console.log("Token used:", token);
        // console.log("Token:", token);
        // const res = await fetch(`${API_BASE_URL}/api/mobile/supervisor/vehicles/${vehicleId}/details`, {
        const res = await fetch(`http://localhost:5000/api/mobile/supervisor/vehicles/${vehicleId}/details`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Failed to load vehicle details:', errorText);
          Alert.alert("Error", "Failed to load vehicle details");
          return;
        }

        const data = await res.json();
        setVehicleDetails(data);
      } catch (err) {
        console.error("Fetch vehicle details error:", err);
        Alert.alert("Error", "Could not load vehicle details");
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      fetchVehicleDetails();
    }
  }, [vehicleId]);

  const handleAction = (action) => {
  let targetRoute = '';

  if (action === 'checkin') targetRoute = `/check-in`;
  else if (action === 'checkout') targetRoute = `/check-out`;
  else if (action === 'fuel') targetRoute = `/log-fuel`;

  router.push({
    pathname: targetRoute,
    params: {
      vehicleId,
      vehicleName,
      odometer: vehicleDetails?.current_odometer || '',
      currentDriver: vehicleDetails?.current_driver || '',
    },
  });
};


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>{vehicleName || 'Vehicle Details'}</Text>
      <Text variant="bodyMedium" style={styles.status}>Assigned</Text>

      {loading ? (
        <ActivityIndicator animating size="large" />
      ) : vehicleDetails ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Current Status:</Text>
            <Text style={styles.cardText}>
              Last Check-in: {vehicleDetails.checked_in_at
                ? new Date(vehicleDetails.checked_in_at).toLocaleString()
                : "N/A"}
            </Text>
            <Text style={styles.cardText}>Current Driver: {vehicleDetails.current_driver || "N/A"}</Text>
            <Text style={styles.cardText}>Odometer: {vehicleDetails.current_odometer || "N/A"} km</Text>
          </Card.Content>
        </Card>
      ) : (
        <Text>No details found.</Text>
      )}

      <View style={styles.buttonContainer}>
       <Button mode="contained" onPress={() => handleAction('checkin')} style={styles.button}>
        Check-in
      </Button>
      <Button mode="outlined" onPress={() => handleAction('checkout')} style={styles.button}>
        Check Out
      </Button>
      <Button mode="contained" onPress={() => handleAction('fuel')} style={styles.button}>
        Log Fuel
      </Button>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 5,
    fontWeight: 'bold',
  },
  status: {
    marginBottom: 20,
    color: '#666',
  },
  card: {
    marginBottom: 20,
  },
  cardTitle: {
    marginBottom: 10,
    fontWeight: 'bold',
  },
  cardText: {
    marginBottom: 5,
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    marginVertical: 5,
  },
});
