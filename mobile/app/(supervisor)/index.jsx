import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../config/api';

const SupervisorDashboard = () => {
  const router = useRouter();
  const theme = useTheme();

  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeDrivers: 0,
    fuelLogs: 0
  });
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Load user info from storage
        const userStr = await AsyncStorage.getItem("user");
        const user = JSON.parse(userStr);
        setUserInfo(user);

        const response = await fetch(`${API_BASE_URL}/api/mobile/dashboard`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();
        setStats({
          totalVehicles: data.totalVehicles,
          activeDrivers: data.activeDrivers,
          fuelLogs: data.fuelLogs
        });
      } catch (err) {
        console.error("Dashboard error:", err);
        Alert.alert("Error", "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>Dashboard</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Overview of fleet operations</Text>

      <View style={styles.cardsContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>Total Vehicles</Text>
            <Text variant="displayMedium" style={styles.cardValue}>
              {stats.totalVehicles}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>Active Drivers</Text>
            <Text variant="displayMedium" style={styles.cardValue}>
              {stats.activeDrivers}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>Fuel Logs</Text>
            <Text variant="displayMedium" style={styles.cardValue}>
              {stats.fuelLogs}
            </Text>
          </Card.Content>
        </Card>
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
  cardsContainer: {
    flexDirection: 'column', // stack vertically
    gap: 15, // vertical spacing between cards (alternative to marginBottom)
  },
  card: {
    width: '100%',         // full width
    padding: 20,           // more spacing inside the card
    borderRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    marginBottom: 8,
    color: '#888',
    textAlign: 'left',
    fontSize: 16,
  },
  cardValue: {
    textAlign: 'left',
    fontSize: 28,
    fontWeight: 'bold',
  },
});


export default SupervisorDashboard;