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
    fuelLogs: 0,
  });
  const [loading, setLoading] = useState(true);

  // ✅ Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = await getItem("token");
        if (!token) {
          Alert.alert("Session Expired", "Please log in again.");
          router.replace("/");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/mobile/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data (${response.status})`);
        }

        const data = await response.json();

        // ✅ Ensure numeric values
        setStats({
          totalVehicles: data.totalVehicles || 0,
          activeDrivers: data.activeDrivers || 0,
          fuelLogs: data.fuelLogs || 0,
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
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>Dashboard</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Overview of fleet operations</Text>

      <View style={styles.cardsContainer}>
        {/* ✅ Total Vehicles Card */}
        <CardWrapper
          active={activeCard === 0}
          setActive={() => setActiveCard(0)}
          onRelease={() => setActiveCard(null)}
        >
          <Card style={[styles.card, activeCard === 0 && styles.cardActive]}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Total Vehicles</Text>
                <Text style={styles.cardValue}>{stats.totalVehicles}</Text>
                <View style={styles.trendContainer}>
                  <TrendingUp size={14} color="#16A34A" />
                  <Text style={styles.trendText}>Active fleet count</Text>
                </View>
              </View>
              <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Car size={24} color="#2563EB" />
              </View>
            </Card.Content>
          </Card>
        </CardWrapper>

        {/* ✅ Active Drivers Card */}
        <CardWrapper
          active={activeCard === 1}
          setActive={() => setActiveCard(1)}
          onRelease={() => setActiveCard(null)}
        >
          <Card style={[styles.card, activeCard === 1 && styles.cardActive]}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Active Drivers</Text>
                <Text style={styles.cardValue}>{stats.activeDrivers}</Text>
                <View style={styles.trendContainer}>
                  <TrendingUp size={14} color="#16A34A" />
                  <Text style={styles.trendText}>Checked in today</Text>
                </View>
              </View>
              <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
                <Users size={24} color="#16A34A" />
              </View>
            </Card.Content>
          </Card>
        </CardWrapper>

        {/* ✅ Fuel Logs Card */}
        <CardWrapper
          active={activeCard === 2}
          setActive={() => setActiveCard(2)}
          onRelease={() => setActiveCard(null)}
        >
          <Card style={[styles.card, activeCard === 2 && styles.cardActive]}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Fuel Logs</Text>
                <Text style={styles.cardValue}>{stats.fuelLogs}</Text>
                <View style={styles.trendContainer}>
                  <TrendingUp size={14} color="#16A34A" />
                  <Text style={styles.trendText}>Recent fuel entries</Text>
                </View>
              </View>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF7ED' }]}>
                <Fuel size={24} color="#EA580C" />
              </View>
            </Card.Content>
          </Card>
        </CardWrapper>
      </View>
    </View>
  );
};

// 🔹 Reusable card wrapper for press animations
const CardWrapper = ({ children, active, setActive, onRelease }) => (
  <View
    onStartShouldSetResponder={() => true}
    onResponderStart={setActive}
    onResponderRelease={onRelease}
    style={styles.cardWrapper}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 10,
    fontWeight: 'bold',
    fontSize: 28,
  },
  subtitle: {
    marginBottom: 20,
    fontSize: 14,
    color: '#4B5563',
  },
  cardsContainer: {
    marginBottom: 16,
    justifyContent: "center",
  },
  cardWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  card: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardActive: {
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
    borderRadius: 50,
    marginLeft: 16,
  },
});

export default SupervisorDashboard;
