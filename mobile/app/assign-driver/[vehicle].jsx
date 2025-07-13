import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { Button, Menu, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { getItemAsync } from 'expo-secure-store';
import API_BASE_URL from '../../config/api';

export default function AssignDriver() {
  const { vehicle } = useLocalSearchParams(); // expects vehicle to be an ID string
  const [visible, setVisible] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const theme = useTheme();

  const getToken = async () => {
    if (Platform.OS === 'web') {
      return localStorage.getItem('token');
    } else {
      return await getItemAsync('token');
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
          driverId: selectedDriver.id,
          vehicleId: vehicle, // must be ID, not the vehicle object
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        Alert.alert("Assignment Failed", result.error || "An error occurred.");
        return;
      }

      Alert.alert("Success", "Driver assigned to vehicle successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error("Assignment error:", err);
      Alert.alert("Error", "Could not assign driver.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>Vehicle: {vehicle}</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Ready for assignment</Text>

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
});
