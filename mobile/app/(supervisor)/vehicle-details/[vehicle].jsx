import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, Alert } from 'react-native';
import { Button, Card, useTheme } from 'react-native-paper';
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

  const getToken = async () => await getItem('token');


  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/api/mobile/supervisor/vehicles/${vehicleId}/details`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Failed to load vehicle details:', errorText);
          Alert.alert("Error", "Failed to load vehicle details");
          return;
        }

        const data = await res.json();
        
        console.log('Fetched details new:', JSON.stringify(data, null, 2));        
        setVehicleDetails(data);
      } catch (err) {
        console.error("Fetch vehicle details error:", err);
        Alert.alert("Error", "Could not load vehicle details");
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      fetchVehicleDetails();
    }
  }, [vehicleId]);

  const handleAction = (action) => {
    let targetRoute = '';

    if (action === 'checkin') targetRoute = `/check-in`;
    else if (action === 'checkout') targetRoute = `/check-out`;
    else if (action === 'fuel') targetRoute = `/log-fuel`;

    const params = {
      tripId: vehicleDetails?.trip_id || '',
      vehicleId,
      vehicleName,
      odometer: vehicleDetails?.current_odometer || '',
      currentDriver: vehicleDetails?.current_driver || '',
      driverId: vehicleDetails?.driver_id || '',
      onSuccess: ""
    };
    
    console.log("Navigating to:", targetRoute, params);
  
  // Simple navigation without Promise chain
  router.push({
    pathname: targetRoute,
    params,
  });
  };

  // Determine if vehicle is checked in (based on your schema)
  const isCheckedIn = vehicleDetails?.checked_in_at && !vehicleDetails?.check_out_time;
  const hasCurrentTrip = !!vehicleDetails?.trip_id;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>{vehicleName || 'Vehicle Details'}</Text>
      <Text variant="bodyMedium" style={styles.status}>Assigned</Text>

      {loading ? (
        <ActivityIndicator animating size="large" />
      ) : vehicleDetails ? (
       <Card style={styles.vehicleCard}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.vehicleCardTitle}>Current Status</Text>
        
        <View style={styles.vehicleStatusContainer}>
          {/* Last Check-in */}
          <View style={styles.vehicleStatusItem}>
            <Clock size={20} color="#00204D" />
            <View style={styles.vehicleStatusTextContainer}>
              <Text style={styles.vehicleStatusLabel}>Last Check-in</Text>
              <Text style={styles.vehicleStatusValue}>
                {vehicleDetails?.checked_in_at 
                  ? new Date(vehicleDetails.checked_in_at).toLocaleString() 
                  : 'N/A'}
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
                {vehicleDetails?.current_odometer ? `${vehicleDetails.current_odometer} km` : 'N/A km'}
              </Text>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
      ) : (
        <Text>No details found.</Text>
      )}

      <View style={styles.buttonContainer}>
        {/* Only show Check-in button if vehicle is not checked in */}
        {!isCheckedIn && (
          <Button 
            mode="contained" 
            onPress={() => handleAction('checkin')} 
            style={styles.button}
          >
            Check-in
          </Button>
        )}

        {/* Only show Check-out and Fuel buttons if vehicle is checked in */}
        {isCheckedIn && (
          <>
            <Button 
              mode="outlined" 
              onPress={() => handleAction('checkout')} 
              style={styles.button}
            >
              Check Out
            </Button>
            <Button 
              mode="contained" 
              onPress={() => handleAction('fuel')} 
              style={styles.button}
            >
              Log Fuel
            </Button>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff' // Add if you want explicit white background
  },
  title: {
    marginBottom: 5,
    fontWeight: 'bold',
    fontSize: 18, // Explicit font size
  },
  status: {
    marginBottom: 20,
    color: '#666',
    fontSize: 14, // Consistent text sizing
  },
  card: {
    marginBottom: 20,
    borderRadius: 8, // Add if cards should have rounded corners
    padding: 16, // Add internal spacing
    backgroundColor: '#fff', // Ensure card background
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    marginBottom: 10,
    fontWeight: 'bold',
    fontSize: 16, // Slightly larger than body text
  },
  cardText: {
    marginBottom: 5,
    fontSize: 14,
    lineHeight: 20, // Better text readability
  },
  buttonContainer: {
    marginTop: 10,
    // flexDirection: 'row', // If you want side-by-side buttons
    justifyContent: 'space-between', // Optional spacing
  },
  button: {
    marginVertical: 5,
    borderRadius: 4, // Standard button rounding
    paddingVertical: 10, // Comfortable tap target
  },
  vehicleCard: {
    borderWidth: 2,
    borderColor: 'rgba(0, 32, 77, 0.2)',
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 20,
  },
  vehicleCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00204D',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 32, 77, 0.1)',
  },
  vehicleStatusContainer: {
    gap: 16,
  },
  vehicleStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleStatusTextContainer: {
    flex: 1,
  },
  vehicleStatusLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  vehicleStatusValue: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
});