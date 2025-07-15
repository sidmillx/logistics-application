import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, Platform } from 'react-native';
import { Card, Text, useTheme, ActivityIndicator, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { getItemAsync } from 'expo-secure-store';
import API_BASE_URL from '../../../config/api';

export default function DriversScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        let token;
        if (Platform.OS === 'web') {
          token = localStorage.getItem('token');
        } else {
          token = await getItemAsync('token');
        }

        const res = await fetch(`${API_BASE_URL}/api/mobile/supervisor/drivers`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch drivers');
        }

        const data = await res.json();
        setDrivers(data);
      } catch (err) {
        console.error("Driver fetch error:", err);
        Alert.alert("Error", "Could not load drivers.");
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator animating size="large" />
        <Text>Loading drivers...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>Drivers</Text>

      <FlatList
        data={drivers}
        renderItem={({ item: driver }) => (
          <Card style={styles.driverCard} mode="elevated">
            <Card.Content>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{driver.name}</Text>

              <Divider style={styles.divider} />

              <Text style={styles.label}>Trips:</Text>
              <Text style={styles.value}>{driver.trips || 'No trips'}</Text>
            </Card.Content>
          </Card>
        )}
        keyExtractor={(item) => item.id}
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
  title: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  driverCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
  label: {
    fontWeight: 'bold',
    color: '#444',
    fontSize: 14,
  },
  value: {
    fontSize: 16,
    marginBottom: 10,
    color: '#222',
  },
  divider: {
    marginVertical: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
});
