import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, Alert } from 'react-native';
import { Card, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { getItemAsync } from 'expo-secure-store';
import API_BASE_URL from '../../../config/api';

export default function VehicleFleet() {
  const theme = useTheme();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const getToken = async () => {
    if (Platform.OS === 'web') {
      return localStorage.getItem('token');
    } else {
      return await getItemAsync('token');
    }
  };

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const token = await getToken();
        if (!token) {
          Alert.alert('Auth Error', 'No token found. Please log in again.');
          router.replace('/'); // Redirect to login if no token
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/mobile/supervisor/vehicles`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errData = await response.text();
          console.error('Fetch vehicles failed:', errData);
          Alert.alert('Error', 'Could not fetch vehicles.');
          return;
        }

        const data = await response.json();
        console.log("🚗 Vehicles from API:", data);

        setVehicles(data);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        Alert.alert('Error', 'Something went wrong while fetching vehicles.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.header}>Vehicle Fleet</Text>

      <FlatList
        data={vehicles}
        renderItem={({ item }) => (
          <Card style={styles.card}>
  <Card.Content>
    <Text style={styles.plate}>Plate: {item.plate_number}</Text>
    <Text style={styles.detail}>Make & Model: {item.make} {item.model}</Text>
    <Text style={styles.detail}>Status: {item.status}</Text>
    <Text style={styles.detail}>Driver: {item.driverName || 'No driver assigned'}</Text>
    {/* <Text style={styles.detail}>Created: {new Date(item.created_at).toLocaleDateString()}</Text> */}

    <Button
      mode={item.driverName ? 'contained' : 'outlined'}
      onPress={() => {
        if (item.driverName) {
          router.push({
            pathname: '/vehicle-details',
            params: {
              vehicleId: item.id,
              vehicleName: item.driverName,
            },
          });
        } else {
          router.push(`/assign-driver/${item.id}`);
        }
      }}
      style={styles.actionButton}
    >
      {item.driverName ? 'View Details' : 'Assign Driver'}
    </Button>
  </Card.Content>
</Card>

        )}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 15,
  },
  vehicleId: {
    fontWeight: 'bold',
  },
  location: {
    marginBottom: 10,
    color: '#666',
  },
  actionButton: {
    marginTop: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  plate: {
  fontWeight: 'bold',
  fontSize: 16,
  marginBottom: 4,
},
detail: {
  fontSize: 14,
  marginBottom: 2,
  color: '#555',
},
});