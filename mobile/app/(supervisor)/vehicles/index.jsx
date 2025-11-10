import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, Alert, TouchableOpacity, TextInput, ActivityIndicator as RNActivity } from 'react-native';
import { Card, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import API_BASE_URL from '../../../config/api';
import { getItem } from '../../../utils/storage';
import { Car, Users } from 'lucide-react-native';

export default function VehicleFleet() {
  const theme = useTheme();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchPlate, setSearchPlate] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const getToken = async () => {
    if (Platform.OS === 'web') {
      return localStorage.getItem('token');
    } else {
      return await getItem('token');
    }
  };

  const fetchVehicles = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      else setRefreshing(true);

      const token = await getToken();
      if (!token) {
        Alert.alert('Auth Error', 'No token found. Please log in again.');
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/mobile/supervisor/vehicles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      if (!text) {
        setVehicles([]);
        setSearchResults([]);
        return;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error('Failed to parse vehicles JSON:', text, parseErr);
        Alert.alert('Error', 'Received invalid data from server.');
        setVehicles([]);
        setSearchResults([]);
        return;
      }

      setVehicles(data);
      setSearchResults(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      Alert.alert('Error', 'Something went wrong while fetching vehicles.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [])
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case 'in-use':
        return styles.statusInUse;
      case 'available':
        return styles.statusAvailable;
      case 'maintenance':
        return styles.statusMaintenance;
      default:
        return styles.statusDefault;
    }
  };

  const formatPlateNumber = (plate) => {
    if (!plate) return 'N/A';
    const match = plate.match(/^([A-Z]{3})(\d{3})([A-Z]{2})$/i);
    if (match) {
      return `${match[1].toUpperCase()} ${match[2]} ${match[3].toUpperCase()}`;
    }
    return plate.toUpperCase();
  };

  // ✅ Live search: filter vehicles on every searchPlate change
  useEffect(() => {
    const term = searchPlate.trim().toLowerCase();
    if (!term) {
      setSearchResults(vehicles);
    } else {
      const results = vehicles.filter((v) =>
        v.plateNumber?.toLowerCase().includes(term)
      );
      setSearchResults(results);
    }
  }, [searchPlate, vehicles]);

  // Filter vehicles by tab
  const filteredVehicles = searchResults.filter((v) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'in-use') return v.status === 'in-use';
    if (selectedTab === 'available') return v.status === 'available';
    if (selectedTab === 'maintenance') return v.status === 'maintenance';
    return true;
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={styles.title}>Vehicle Fleet</Text>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'all', label: 'All' },
          { key: 'in-use', label: 'In Use' },
          { key: 'available', label: 'Available' },
          { key: 'maintenance', label: 'Maintenance' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, selectedTab === tab.key && styles.activeTabButton]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Input */}
      <TextInput
        placeholder="Search by plate number"
        value={searchPlate}
        onChangeText={setSearchPlate}
        style={{
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          paddingHorizontal: 12,
          height: 40,
          backgroundColor: '#fff',
        }}
      />

      <FlatList
        data={filteredVehicles}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardInner}>
              <View style={styles.plateContainer}>
                <View style={styles.plateBox}>
                  <Text style={styles.plateText}>{formatPlateNumber(item.plateNumber)}</Text>
                </View>
                <View style={styles.plateDotLeft} />
                <View style={styles.plateDotRight} />
              </View>

              <View style={styles.vehicleInfoRow}>
                <View style={styles.vehicleInfoLeft}>
                  <View style={styles.iconWrapper}>
                    <Car size={20} color="#6B7280" />
                  </View>
                  <View style={styles.vehicleDetails}>
                    <Text style={styles.vehicleName}>
                      {item.make} {item.model}
                    </Text>
                    <Text style={styles.vehicleType}>{item.model || 'Unknown Model'}</Text>
                  </View>
                </View>

                <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                  <Text style={styles.statusText}>
                    {item.status === 'in-use'
                      ? 'In Use'
                      : item.status === 'maintenance'
                      ? 'Maintenance'
                      : 'Available'}
                  </Text>
                </View>
              </View>

              <View style={styles.driverSection}>
                <View style={styles.driverRow}>
                  <Users size={16} color="#6B7280" />
                  <Text style={styles.driverLabel}>Driver:</Text>
                  <Text style={[styles.driverName, !item.driverName && styles.driverEmpty]}>
                    {item.driverName ? item.driverName : 'No driver assigned'}
                  </Text>
                </View>
              </View>

              <Button
                mode={item.driverName ? 'contained' : 'outlined'}
                onPress={() => {
                  if (item.status === 'maintenance') {
                    Alert.alert('Notice', 'Vehicle under maintenance');
                    return;
                  }
                  if (item.driverName) {
                    router.push({
                      pathname: `/vehicle-details/${item.id}`,
                      params: {
                        vehicleId: item.id,
                        vehicleName: item.driverName,
                      },
                    });
                  } else {
                    router.push({
                      pathname: `/assign-driver/${item.id}`,
                      params: { plateNumber: item.plateNumber },
                    });
                  }
                }}
                style={styles.actionButton}
              >
                {item.status === 'maintenance'
                  ? 'Vehicle Under Maintenance'
                  : item.driverName
                  ? 'View Details'
                  : 'Assign Driver'}
              </Button>
            </View>
          </Card>
        )}
      />

      {refreshing && (
        <View style={styles.overlay}>
          <RNActivity size="large" color="#002246" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: '700',
    fontSize: 26,
    color: '#111827',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    paddingVertical: 10,
    borderRadius: 50,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  activeTabButton: {
    backgroundColor: '#002246',
  },
  tabText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 12,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  cardInner: {
    padding: 16,
    gap: 16,
  },
  plateText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  plateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'center',
  },
  plateBox: {
    backgroundColor: '#002246',
    borderWidth: 3,
    borderColor: '#002246',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  plateDotLeft: {
    position: 'absolute',
    left: -4,
    top: '50%',
    transform: [{ translateY: -4 }],
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  plateDotRight: {
    position: 'absolute',
    right: -4,
    top: '50%',
    transform: [{ translateY: -4 }],
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconWrapper: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 8,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  vehicleType: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  statusText: {
    fontWeight: '500',
    fontSize: 12,
  },
  statusAvailable: {
    backgroundColor: '#ECFDF5',
  },
  statusInUse: {
    backgroundColor: '#FEF3C7',
  },
  statusMaintenance: {
    backgroundColor: '#DBEAFE',
  },
  statusDefault: {
    backgroundColor: '#F3F4F6',
  },
  driverSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverLabel: {
    color: '#6B7280',
    fontSize: 13,
  },
  driverName: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '500',
  },
  driverEmpty: {
    fontStyle: 'italic',
    color: '#9CA3AF',
  },
  actionButton: {
    width: '100%',
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
