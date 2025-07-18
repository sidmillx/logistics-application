import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import API_BASE_URL from '../../config/api';
import { getItem } from '../../utils/storage';
import { Car, Users, Fuel, TrendingUp } from 'lucide-react-native';

const SupervisorDashboard = () => {
  const router = useRouter();
  const theme = useTheme();
  const [activeCard, setActiveCard] = useState(null);

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
        const userStr = await getItem("user");
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
      {/* Total Vehicles Card */}
      <View 
        onStartShouldSetResponder={() => true}
        onResponderStart={() => setActiveCard(0)}
        onResponderRelease={() => setActiveCard(null)}
        style={styles.cardWrapper}
      >
        <Card style={[styles.card, activeCard === 0 && styles.cardActive]}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>Total Vehicles</Text>
              <Text style={styles.cardValue}>3</Text>
              <View style={styles.trendContainer}>
                <TrendingUp size={14} color="#16A34A" />
                <Text style={styles.trendText}>+2 this month</Text>
              </View>
            </View>
            <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Car size={24} color="#2563EB" />
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Active Drivers Card */}
      <View 
        onStartShouldSetResponder={() => true}
        onResponderStart={() => setActiveCard(1)}
        onResponderRelease={() => setActiveCard(null)}
        style={styles.cardWrapper}
      >
        <Card style={[styles.card, activeCard === 1 && styles.cardActive]}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>Active Drivers</Text>
              <Text style={styles.cardValue}>4</Text>
              <View style={styles.trendContainer}>
                <TrendingUp size={14} color="#16A34A" />
                <Text style={styles.trendText}>All available</Text>
              </View>
            </View>
            <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
              <Users size={24} color="#16A34A" />
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Fuel Logs Card */}
      <View 
        onStartShouldSetResponder={() => true}
        onResponderStart={() => setActiveCard(2)}
        onResponderRelease={() => setActiveCard(null)}
        style={styles.cardWrapper}
      >
        <Card style={[styles.card, activeCard === 2 && styles.cardActive]}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>Fuel Logs</Text>
              <Text style={styles.cardValue}>8</Text>
              <View style={styles.trendContainer}>
                <TrendingUp size={14} color="#16A34A" />
                <Text style={styles.trendText}>3 today</Text>
              </View>
            </View>
            <View style={[styles.iconContainer, { backgroundColor: '#FFF7ED' }]}>
              <Fuel size={24} color="#EA580C" />
            </View>
          </Card.Content>
        </Card>
      </View>
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
    marginBottom: 10,
    fontWeight: 'bold',
    fontSize: 32,
    lineHeight: 32, // Good - unitless
  },
  subtitle: {
    marginBottom: 20,
    fontSize: 16,
    color: '#4B5563', // Equivalent to rgb(75, 85, 99) but as hex
  },
  cardsContainer: {
    marginBottom: 16,
    justifyContent: "center"
  },
  cardWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  card: {
    borderRadius: 8,
    borderWidth: 0, // Correct RN syntax (not border: 0)
    backgroundColor: '#FFFFFF',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Android shadow
    elevation: 2,
  },
  cardActive: {
    // Enhanced shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00204D',
    marginBottom: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 50, // Perfect for circle
    marginLeft: 16,
  },
});
export default SupervisorDashboard;