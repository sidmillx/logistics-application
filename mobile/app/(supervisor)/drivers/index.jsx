import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, Platform } from 'react-native';
import { Card, Text, useTheme, ActivityIndicator, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { getItem } from '../../../utils/storage';
import API_BASE_URL from '../../../config/api';
import { MapPin, Clock, User } from 'lucide-react-native';

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
          token = await getItem('token');
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
        console.log('Fetched driver details new:', JSON.stringify(data, null, 2));        

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

   const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return styles.activeBadge;
      case "assigned":
        return styles.assignedBadge;
      default:
        return styles.defaultBadge;
    }
  };

  function getLatestInfo(driver) {
  const checkinTime = driver.last_checkin_time ? new Date(driver.last_checkin_time) : null;
  const checkoutTime = driver.last_checkout_time ? new Date(driver.last_checkout_time) : null;

  if (!checkinTime && !checkoutTime) {
    return { lastSeen: 'N/A', currentLocation: 'Unknown' };
  }
  if (checkinTime && !checkoutTime) {
    return { lastSeen: checkinTime.toLocaleString(), currentLocation: driver.last_checkin_location || 'Unknown' };
  }
  if (!checkinTime && checkoutTime) {
    return { lastSeen: checkoutTime.toLocaleString(), currentLocation: driver.last_checkout_location || 'Unknown' };
  }
  // Both exist, pick the later one
  if (checkinTime > checkoutTime) {
    return { lastSeen: checkinTime.toLocaleString(), currentLocation: driver.last_checkin_location || 'Unknown' };
  } else {
    return { lastSeen: checkoutTime.toLocaleString(), currentLocation: driver.last_checkout_location || 'Unknown' };
  }
}


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>Drivers</Text>

      <FlatList
  data={drivers}
  renderItem={({ item: driver }) => {
    const { lastSeen, currentLocation } = getLatestInfo(driver);

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.driverInfo}>
              <View style={styles.iconContainer}>
                <User size={20} color="#00204D" />
              </View>
              <View>
                <Text style={styles.driverName}>{driver.name}</Text>
                <Text style={[styles.badge, getStatusColor(driver.status)]}>
                  {driver.status || 'Unknown'}
                </Text>
              </View>
            </View>
            <View style={styles.tripsContainer}>
              <Text style={styles.tripsCount}>{driver.trips}</Text>
              <Text style={styles.tripsLabel}>trips</Text>
            </View>
          </View>

          <View style={styles.driverDetails}>
            <View style={styles.detailRow}>
              <MapPin size={16} color="#666" />
              <Text style={styles.detailText}>{currentLocation}</Text>
            </View>
            <View style={styles.detailRow}>
              <Clock size={16} color="#666" />
              <Text style={styles.detailText}>Last seen {lastSeen}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }}
  keyExtractor={(item) => item.id}
/>

    </View>
  );
}

//  <Card style={styles.driverCard} mode="elevated">
 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa' // Light background for better contrast
  },
  title: {
    marginBottom: 20,
    fontWeight: 'bold',
    fontSize: 24, // Explicit size for headings
    color: '#1a1a1a' // Darker text for better readability
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    backgroundColor: 'rgba(0, 32, 77, 0.1)',
    padding: 8,
    borderRadius: 20,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00204D',
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '500',
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  assignedBadge: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },
  defaultBadge: {
    backgroundColor: '#F3F4F6',
    color: '#1F2937',
  },
  tripsContainer: {
    alignItems: 'flex-end',
  },
  tripsCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00204D',
  },
  tripsLabel: {
    fontSize: 12,
    color: '#666',
  },
  driverDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
});