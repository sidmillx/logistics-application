import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';

export default function VehicleFleet() {
  const theme = useTheme();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/mobile/supervisor/vehicles');
        const data = await response.json();
        setVehicles(data);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
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
              <Text variant="titleLarge" style={styles.vehicleId}>{item.id}</Text>
              <Text variant="bodyMedium" style={styles.location}>
                {item.driverName ? item.driverName : 'No driver assigned'}
              </Text>
              {item.driverName ? (
                <Button 
                  mode="contained" 
                  onPress={() => router.push(`/vehicle-details/${item.id}`)}
                  style={styles.actionButton}
                >
                  View Details
                </Button>
              ) : (
                <Button 
                  mode="outlined" 
                  onPress={() => router.push(`/assign-driver/${item.id}`)}
                  style={styles.actionButton}
                >
                  Assign Driver
                </Button>
              )}
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
});
