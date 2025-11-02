import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Button, Card, useTheme, Menu, Switch } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import API_BASE_URL from '../../../config/api';
import { getItem } from '../../../utils/storage';
import { Clock, User, Gauge } from 'lucide-react-native';

export default function VehicleDetails() {
  const { vehicleId, vehicleName } = useLocalSearchParams();
  const theme = useTheme();

  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Driver selection
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Permanent assignment toggle
  const [permanent, setPermanent] = useState(false); // Will be set from API

  // Track unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  const getToken = async () => await getItem('token');

  // Fetch vehicle details + current assignment
  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/api/mobile/supervisor/vehicles/${vehicleId}/details`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load vehicle details');
        const data = await res.json();

        setVehicleDetails(data);

        // Set current driver
        const driver = data.current_driver_id
          ? { id: data.current_driver_id, fullname: data.current_driver }
          : null;
        setSelectedDriver(driver);

        // Set permanent toggle from DB
        setPermanent(!!data.current_assignment_permanent);

      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Could not load vehicle details");
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) fetchVehicleDetails();
  }, [vehicleId]);

  // Fetch list of all drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/api/mobile/drivers`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load drivers');
        const data = await res.json();
        setDrivers(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDrivers();
  }, []);

  // Detect changes in driver OR permanent toggle
  useEffect(() => {
    if (!vehicleDetails) return;

    const currentDriverId = vehicleDetails.current_driver_id || null;
    const currentPermanent = !!vehicleDetails.current_assignment_permanent;

    const driverChanged = (selectedDriver?.id || null) !== currentDriverId;
    const permanentChanged = permanent !== currentPermanent;

    const changes = driverChanged || permanentChanged;
    setHasChanges(changes);
  }, [selectedDriver, permanent, vehicleDetails]);

  const handleUpdateAssignment = async () => {
    if (!selectedDriver) {
      Alert.alert("Error", "Please select a driver.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();

      if (!vehicleDetails.current_assignment_id) {
        // Create new assignment
        const res = await fetch(`${API_BASE_URL}/api/mobile/supervisor/assignments`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            driverId: selectedDriver.id,
            vehicleId: vehicleId,
            permanent
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to create assignment");

        Alert.alert("Success", "Assignment created successfully!");

        setVehicleDetails(prev => ({
          ...prev,
          current_driver: selectedDriver.fullname,
          current_driver_id: selectedDriver.id,
          current_assignment_permanent: permanent,
          current_assignment_id: result.id
        }));
      } else {
        // Update existing assignment
        const res = await fetch(
          `${API_BASE_URL}/api/mobile/supervisor/assignments/${vehicleDetails.current_assignment_id}`,
          {
            method: "PUT",
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ driverId: selectedDriver.id, permanent }),
          }
        );
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to update assignment");

        Alert.alert("Success", "Assignment updated successfully!");

        setVehicleDetails(prev => ({
          ...prev,
          current_driver: selectedDriver.fullname,
          current_driver_id: selectedDriver.id,
          current_assignment_permanent: permanent
        }));
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 1) {
        const confirm = window.confirm(`${title}\n\n${message}`);
        if (confirm) {
          const removeButton = buttons.find(b => b.text.toLowerCase() === 'remove');
          if (removeButton?.onPress) removeButton.onPress();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const handleRemoveAssignment = async () => {
    if (!vehicleDetails.current_assignment_id) return;

    showAlert(
      "Confirm Remove",
      "Are you sure you want to remove this assignment?",
      [
        { text: "Cancel" },
        {
          text: "Remove",
          onPress: async () => {
            setSubmitting(true);
            try {
              const token = await getToken();
              const res = await fetch(
                `${API_BASE_URL}/api/mobile/supervisor/assignments/${vehicleDetails.current_assignment_id}`,
                {
                  method: "DELETE",
                  headers: { 'Authorization': `Bearer ${token}` },
                }
              );
              if (!res.ok) throw new Error("Failed to remove assignment");

              // showAlert("Removed", "Assignment removed successfully!");
              if (Platform.OS === 'web') {
  // ✅ Works in browsers
  window.alert("Assignment removed successfully!");
  setTimeout(() => {
    router.push('/(supervisor)/vehicles'); // replace() can sometimes fail on web
  }, 100);
} else {
  // ✅ Works on Android/iOS
  Alert.alert(
    "Removed",
    "Assignment removed successfully!",
    [
      {
        text: "OK",
        onPress: () => {
          console.log('Redirecting after OK');
          router.replace('/(supervisor)/vehicles');
        },
      },
    ]
  );
}
              

              setVehicleDetails(prev => ({
                ...prev,
                current_driver: null,
                current_driver_id: null,
                current_assignment_id: null,
                current_assignment_permanent: false,
              }));

              setSelectedDriver(null);
              setPermanent(false);



            } catch (err) {
              console.error(err);
              showAlert("Error", err.message);
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleAction = (action) => {
    let targetRoute = '';
    if (action === 'checkin') targetRoute = `/check-in`;
    else if (action === 'checkout') targetRoute = `/check-out`;
    else if (action === 'fuel') targetRoute = `/log-fuel`;

    const params = {
      tripId: vehicleDetails?.trip_id || '',
      vehicleId,
      vehicleName,
      odometer: vehicleDetails?.start_odometer || '',
      currentDriver: vehicleDetails?.current_driver || '',
      driverId: vehicleDetails?.driver_id || '',
      onSuccess: ""
    };
    router.push({ pathname: targetRoute, params });
  };

  const hasCurrentTrip = !!vehicleDetails?.trip_id;
  const isCheckedIn = !!vehicleDetails?.trip_id;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>{vehicleName || 'Vehicle Details'}</Text>
      <Text variant="bodyMedium" style={styles.status}>Assigned</Text>

      {loading ? (
        <ActivityIndicator animating size="large" />
      ) : vehicleDetails ? (
        <>
          {/* Vehicle Status Card */}
          <Card style={styles.vehicleCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.vehicleCardTitle}>Current Status</Text>

              <View style={styles.vehicleStatusContainer}>
                {/* Last Check-in / Check-out */}
                <View style={styles.vehicleStatusItem}>
                  <Clock size={20} color="#00204D" />
                  <View style={styles.vehicleStatusTextContainer}>
                    <Text style={styles.vehicleStatusLabel}>
                      {hasCurrentTrip ? "Last Check-out" : "Last Check-in"}
                    </Text>
                    <Text style={styles.vehicleStatusValue}>
                      {hasCurrentTrip
                        ? vehicleDetails?.checked_out_at
                          ? new Date(vehicleDetails.checked_out_at).toLocaleString()
                          : "N/A"
                        : vehicleDetails?.checked_in_at
                          ? new Date(vehicleDetails.checked_in_at).toLocaleString()
                          : "N/A"}
                    </Text>
                  </View>
                </View>

                {/* Current Driver */}
                <View style={styles.vehicleStatusItem}>
                  <User size={20} color="#00204D" />
                  <View style={styles.vehicleStatusTextContainer}>
                    <Text style={styles.vehicleStatusLabel}>Current Driver</Text>
                    <Text style={[styles.vehicleStatusValue, { color: '#00204D' }]}>
                      {vehicleDetails?.current_driver || 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Odometer */}
                <View style={styles.vehicleStatusItem}>
                  <Gauge size={20} color="#00204D" />
                  <View style={styles.vehicleStatusTextContainer}>
                    <Text style={styles.vehicleStatusLabel}>Odometer</Text>
                    <Text style={styles.vehicleStatusValue}>
                      {vehicleDetails?.start_odometer ? `${vehicleDetails.start_odometer} km` : 'N/A km'}
                    </Text>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {!isCheckedIn && (
              <Button mode="contained" onPress={() => handleAction('checkin')} style={styles.button}>
                Check-in
              </Button>
            )}
            {isCheckedIn && (
              <>
                <Button mode="outlined" onPress={() => handleAction('checkout')} style={styles.button}>
                  Check Out
                </Button>
                <Button mode="contained" onPress={() => handleAction('fuel')} style={styles.button}>
                  Log Fuel
                </Button>
              </>
            )}
          </View>

          {/* Change Assignment Section */}
          <Text style={styles.assignmentHeading}>Change Assignment</Text>

          <View style={styles.menuContainer}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button mode="outlined" onPress={() => setMenuVisible(true)}>
                  {selectedDriver ? selectedDriver.fullname : "Select Driver"}
                </Button>
              }
            >
              <ScrollView style={{ maxHeight: 300 }}>
                {drivers.map(driver => (
                  <Menu.Item
                    key={driver.id}
                    title={driver.fullname}
                    onPress={() => {
                      setSelectedDriver(driver);
                      setMenuVisible(false);
                    }}
                  />
                ))}
              </ScrollView>
            </Menu>
          </View>

          <View style={styles.permanentToggleContainer}>
            <Text style={styles.permanentLabel}>Permanent Assignment</Text>
            <Switch
              value={permanent}
              onValueChange={setPermanent}
              color={theme.colors.primary}
            />
          </View>

          {/* Optional: Visual feedback for changes */}
          {hasChanges && selectedDriver && (
            <Text style={{ color: 'green', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
              You have unsaved changes
            </Text>
          )}

          <Button
            mode="contained"
            onPress={handleUpdateAssignment}
            loading={submitting}
            disabled={!selectedDriver || !hasChanges || submitting}
            style={styles.button}
          >
            Update Assignment
          </Button>

          <Button
            mode="outlined"
            onPress={handleRemoveAssignment}
            loading={submitting}
            disabled={!vehicleDetails?.current_assignment_id || submitting}
            style={[styles.button, { marginTop: 10 }]}
          >
            Remove Assignment
          </Button>
        </>
      ) : (
        <Text>No details found.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { marginBottom: 5, fontWeight: 'bold', fontSize: 18 },
  status: { marginBottom: 20, color: '#666', fontSize: 14 },
  vehicleCard: {
    borderWidth: 2,
    borderColor: 'rgba(0, 32, 77, 0.2)',
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 20
  },
  vehicleCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00204D',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 32, 77, 0.1)'
  },
  vehicleStatusContainer: { gap: 16 },
  vehicleStatusItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleStatusTextContainer: { flex: 1 },
  vehicleStatusLabel: { fontSize: 14, color: '#6b7280' },
  vehicleStatusValue: { fontSize: 16, fontWeight: '500', marginTop: 4 },
  buttonContainer: { marginTop: 10, justifyContent: 'space-between' },
  button: { marginVertical: 5, borderRadius: 4, paddingVertical: 4 },
  assignmentHeading: { fontSize: 16, fontWeight: '600', marginTop: 40, marginBottom: 10 },
  menuContainer: { marginBottom: 10 },
  permanentToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  permanentLabel: { fontSize: 14, fontWeight: '500' },
});