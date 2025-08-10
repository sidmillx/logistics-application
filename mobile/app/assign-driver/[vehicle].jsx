import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { Button, Menu, useTheme, Select } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import API_BASE_URL from '../../config/api';
import { getItem } from '../../utils/storage';
import { Car } from 'lucide-react-native'

export default function AssignDriver() {
  const { vehicle, plateNumber } = useLocalSearchParams(); // expects vehicle to be an ID string
  const [visible, setVisible] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [status, setStatus] = useState('Available'); // or whatever status you want

  // const [vehicleData, setVehicleData] = useState(null);

  const theme = useTheme();

  const getToken = async () => {
    if (Platform.OS === 'web') {
      return localStorage.getItem('token');
    } else {
      return await getItem('token');
    }
  };

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const token = await getToken();

        const res = await fetch(`${API_BASE_URL}/api/mobile/drivers`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();
        setDrivers(data);
      } catch (error) {
        console.error("Failed to load drivers", error);
      }
    };

    fetchDrivers();
  }, []);

//   useEffect(() => {
//   const fetchVehicle = async () => {
//     try {
//       const token = await getToken();
//       const res = await fetch(`${API_BASE_URL}/api/mobile/supervisor/vehicles/${vehicle}`, {
//         headers: {
//           "Authorization": `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       const data = await res.json();
//       setVehicleData(data);
//     } catch (err) {
//       console.error("Failed to fetch vehicle info:", err);
//     }
//   };

//   if (vehicle) fetchVehicle();
// }, [vehicle]);


  const handleAssign = async () => {
    try {
      const token = await getToken();

      const res = await fetch(`${API_BASE_URL}/api/mobile/supervisor/assignments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driverId: selectedDriver ? selectedDriver.id : null,
          vehicleId: vehicle, // must be ID, not the vehicle object
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        Alert.alert("Assignment Failed", result.error || "An error occurred.");
        return;
      }

      Alert.alert("Success", "Driver assigned to vehicle successfully!", [
        { text: "OK", onPress: () => router.replace('/') },
      ]);
    } catch (err) {
      console.error("Assignment error:", err);
      Alert.alert("Error", "Could not assign driver.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.assignmentCard}>
          <View style={styles.assignmentCardHeader}>
            <View style={styles.assignmentIconContainer}>
             <Car />
            </View>
            <Text style={styles.assignmentCardTitle}>Vehicle Details</Text>
          </View>
          
          <View style={styles.assignmentCardContent}>
            <View style={styles.assignmentVehicleIdContainer}>
              <Text style={styles.assignmentVehicleIdLabel}>Vehicle</Text>
              <Text style={styles.assignmentVehicleIdValue}>
                {plateNumber}
              </Text>
            </View>
            
            <View style={styles.assignmentStatusContainer}>
              <View style={styles.assignmentStatusIndicator} />
              <Text style={styles.assignmentStatusText}>{status}</Text>
            </View>
          </View>
        </View>

      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setVisible(true)}
            style={styles.menuButton}
          >
            {selectedDriver ? selectedDriver.fullname : "Select Driver"}
          </Button>
        }
      >
        {drivers.map(driver => (
          <Menu.Item
            key={driver.id}
            title={driver.fullname}
            onPress={() => {
              setSelectedDriver(driver);
              setVisible(false);
            }}
          />
        ))}
      </Menu>
      

      <Button
        mode="contained"
        disabled={!selectedDriver}
        onPress={handleAssign}
        style={styles.assignButton}
      >
        Start Assignment
      </Button>
    </View>
  );
}

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
  menuButton: {
    marginBottom: 20,
  },
  assignButton: {
    marginTop: 10,
  },

  assignmentCard: {
    borderWidth: 2,
    borderColor: 'rgba(0, 32, 77, 0.2)',
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    padding: 16,
    marginBottom: 20
  },
  assignmentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 32, 77, 0.1)',
  },
  assignmentIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(0, 32, 77, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  assignmentCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00204D',
  },
  assignmentCardContent: {
    gap: 16,
  },
  assignmentVehicleIdContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
  },
  assignmentVehicleIdLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  assignmentVehicleIdValue: {
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: '600',
    color: '#00204D',
  },
  assignmentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assignmentStatusIndicator: {
    width: 8,
    height: 8,
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  assignmentStatusText: {
    color: '#059669',
    fontWeight: '500',
  },
});
