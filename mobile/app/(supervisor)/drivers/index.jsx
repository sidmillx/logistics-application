import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, Platform } from 'react-native';
import { Card, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { getItemAsync } from 'expo-secure-store';
import API_BASE_URL from '../../../config/api';

export default function DriversScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [groupedDrivers, setGroupedDrivers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
       let token;
      if (Platform.OS === 'web') {
        // Use localStorage for web
        token = localStorage.getItem('token');
      } else {
        // Use expo-secure-store for native platforms
        token = await getItemAsync('token');
      }
        const res = await fetch(`${API_BASE_URL}/api/mobile/supervisor/drivers`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // optional if your endpoint needs auth
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch drivers');
        }

        const drivers = await res.json();

        const grouped = drivers.reduce((acc, driver) => {
          const group = driver.group || 'Ungrouped';
          if (!acc[group]) acc[group] = [];
          acc[group].push(driver);
          return acc;
        }, {});

        setGroupedDrivers(grouped);
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
        data={Object.entries(groupedDrivers)}
        renderItem={({ item: [group, drivers] }) => (
          <Card style={styles.groupCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.groupTitle}>{group}</Text>
              {drivers.map(driver => (
                <View key={driver.id} style={styles.driverItem}>
                  <Text variant="bodyLarge">{driver.name}</Text>
                  <Text variant="bodyMedium" style={styles.tripsText}>{driver.trips || 'No trips'}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
        keyExtractor={([group]) => group}
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
  groupCard: {
    marginBottom: 16,
  },
  groupTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  driverItem: {
    marginBottom: 12,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#6200ee',
  },
  tripsText: {
    color: '#666',
  },
  listContent: {
    paddingBottom: 20,
  },
});
