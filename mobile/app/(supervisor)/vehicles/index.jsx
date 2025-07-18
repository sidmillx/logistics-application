import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, Alert } from 'react-native';
import { Card, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import API_BASE_URL from '../../../config/api';
import { getItem } from '../../../utils/storage';
import { Car, Badge, User } from 'lucide-react-native';

export default function VehicleFleet() {
  const theme = useTheme();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const getToken = async () => {
    if (Platform.OS === 'web') {
      return localStorage.getItem('token');
    } else {
      return await getItem('token');
    }
  };

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const token = await getToken();
        if (!token) {
          Alert.alert('Auth Error', 'No token found. Please log in again.');
          router.replace('/login'); // Redirect to login if no token
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

   const getStatusColor = (status) => {
    switch (status) {
      case "in-use":
        // return "bg-green-100 text-green-800"
        return styles.inUse;
      case "available":
        // return "bg-blue-100 text-blue-800"
        return styles.available;
      case "maintenance":
        // return "bg-orange-100 text-orange-800"
        return styles.maintenance;
      default:
        // return "bg-gray-100 text-gray-800"
        return styles.default;
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>Vehicle Fleet</Text>

      <FlatList
        data={vehicles}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              {/* card header */}
              <View style={styles.cardHeader}>
                <View style={styles.vehicleInfo}>
                  <View style={styles.vehicleIcon}>
                    <Car size={24} style={{color: '#00204D'}} />
                  </View>
                  <View style={styles.vehicleDetails}>
                    <Text style={styles.plate}>{item.plate_number}</Text>
                    <Text style={styles.detail}>Make & Model: {item.make} {item.model}</Text>
                  </View>
                </View>
                <Text style={getStatusColor(item.status)}>{item.status}</Text>
              </View>

              {/* VEHICLE STATS */}
              <View style={styles.vehicleStats}>
                {/* item 1 */}
                <View style={styles.statItem}>
                  <View style={styles.statLabel}>
                    <User size={16} style={{color: 'rgb(156, 163, 175)'}}/>
                    <Text style={styles.statText}>Driver</Text>
                  </View>
                  <Text style={styles.statValue}>{item.driverName || 'No driver assigned'}</Text>
                </View>

                {/* item 2 */}
                <View style={styles.statItem}>
                  <View style={styles.statLabel}>
                    <User size={16} style={{color: 'rgb(156, 163, 175)'}}/>
                    <Text style={styles.statText}>Driver</Text>
                  </View>
                  <Text style={styles.statValue}>{item.driverName || 'No driver assigned'}</Text>
                </View>
              </View>
              
              
            
              {/* <Text style={styles.detail}>Created: {new Date(item.created_at).toLocaleDateString()}</Text> */}

              <Button
                mode={item.driverName ? 'contained' : 'outlined'}
                onPress={() => {
                 if (item.status === 'maintenance') {
                    Alert.alert('Notice', 'Vehicle under maintenance');
                    return;
                  }
                  if (item.driverName) {
                    router.push({
                      pathname: '/vehicle-details',
                      params: {
                        vehicleId: item.id,
                        vehicleName: item.driverName,
                      },
                    });
                  } else {
                    router.push({
                      pathname: `/assign-driver/${item.id}`,
                      params: {
                        plateNumber: item.plate_number, 
                      },
                    });
                  }
                }}
                style={[
                  styles.actionButton,
                  item.status === 'maintenance' && styles.disabledButton, // add disabled style
                ]}
              >
                {item.status === 'maintenance'
                  ? 'Vehicle Under Maintenance'
                  : item.driverName
                  ? 'View Details'
                  : 'Assign Driver'}
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
  title: {
    marginBottom: 20,
    fontWeight: 'bold',
    fontSize: 32,
    lineHeight: 32,
  },
  disabledButton: {
  backgroundColor: '#ccc',   // lighter gray bg
  color: '#666',             // gray text
},
  card: {
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: '#fff',
    elevation: 3
  },
  cardHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  vehicleInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10 // Replaces gap: 10
  },
  vehicleIcon: {
    padding: 10,
    backgroundColor: 'rgba(0, 32, 77, 0.1)',
    borderRadius: 99999
  },
  vehicleId: {
    fontWeight: 'bold',
  },
  location: {
    marginBottom: 10,
    color: '#666',
  },
  actionButton: {
    width: '100%',    
    paddingVertical: 8,
    paddingHorizontal: 12,
    // backgroundColor: '#00204d',
    color: '#fff',
    borderRadius: 5,
    fontWeight: '500',
    marginTop: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  plate: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
    color: '#00204D'
  },
  detail: {
    fontSize: 14,
    marginBottom: 2,
    color: 'rgb(75, 85, 99)',
  },
  vehicleStats: {
    flex: 1,
    flexDirection: 'column',
    marginBottom: 10
  },
  statText: {
    color: 'rgb(75, 85, 99)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10 // Adds spacing instead of gap
  },
  statLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 5, // Replaces gap: 5
    fontSize: 14,
    color: 'rgb(75, 85, 99)'
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00204d'
  },
  available: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  maintenance: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  inUse: {
    backgroundColor: '#FFEDD5',
    color: '#9A3412',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  default: {
    backgroundColor: '#F3F4F6',
    color: '#1F2937',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  }
});