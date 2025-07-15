import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Card, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from "../../config/api";
import PropTypes from 'prop-types';

// Constants for error messages and configuration
const ERROR_MESSAGES = {
  AUTH_ERROR: 'Authentication failed. Please login again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  DATA_ERROR: 'Failed to load dashboard data.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

const API_TIMEOUT = 10000; // 10 seconds timeout for API calls

const DashboardScreen = () => {
  const theme = useTheme();
  const [tripData, setTripData] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverName, setDriverName] = useState('');
  const [error, setError] = useState(null);

  const handleApiError = (error, customMessage) => {
    console.error('Dashboard Error:', error);
    
    let errorMessage = customMessage || ERROR_MESSAGES.UNKNOWN_ERROR;
    
    if (error.message.includes('Network request failed')) {
      errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
    } else if (error.response?.status >= 500) {
      errorMessage = ERROR_MESSAGES.SERVER_ERROR;
    } else if (error.response?.status === 401) {
      errorMessage = ERROR_MESSAGES.AUTH_ERROR;
      AsyncStorage.clear().then(() => router.replace('/'));
    }
    
    setError(errorMessage);
    Alert.alert('Error', errorMessage);
    return errorMessage;
  };

  const fetchWithTimeout = (url, options, timeout = API_TIMEOUT) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]);
  };

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const [token, userString] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user')
      ]);

      if (!token || !userString) {
        throw new Error(ERROR_MESSAGES.AUTH_ERROR);
      }

      const user = JSON.parse(userString);
      setDriverName(user.fullname || user.username || 'Driver');

      // Fetch active trip with timeout
      const tripRes = await fetchWithTimeout(
        `${API_BASE_URL}/api/mobile/driver/active-trip`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!tripRes.ok) throw new Error(ERROR_MESSAGES.DATA_ERROR);

      const tripJson = await tripRes.json();
      
      if (tripJson?.tripId) {
        setTripData(tripJson);
        return; // Active trip found, no need to check assignment
      }

      // No active trip, fetch assignment
      const assignmentRes = await fetchWithTimeout(
        `${API_BASE_URL}/api/mobile/driver/assignment`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!assignmentRes.ok) throw new Error(ERROR_MESSAGES.DATA_ERROR);

      const assignmentJson = await assignmentRes.json();
      
      if (assignmentJson?.vehicleId) {
        setAssignment(assignmentJson);
      }
    } catch (err) {
      handleApiError(err, ERROR_MESSAGES.DATA_ERROR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      router.replace('/');
    } catch (err) {
      handleApiError(err, 'Failed to logout. Please try again.');
    }
  };

  const handleNavigation = (route, params = {}) => {
  try {
    router.push({ 
      pathname: route, 
      params: { ...params, onSuccess: fetchData } // Pass fetchData as callback
    });
  } catch (err) {
    handleApiError(err, 'Navigation failed. Please try again.');
  }
};

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.welcomeText}>
        Welcome {driverName}, to your dashboard
      </Text>

      {error && !loading && (
        <Card style={[styles.card, styles.errorCard]}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
            <Button 
              mode="contained" 
              onPress={fetchData}
              style={styles.retryButton}
            >
              Retry
            </Button>
          </Card.Content>
        </Card>
      )}

      {tripData ? (
        <>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitle}>Active Trip</Text>
              <View style={styles.vehicleInfo}>
                <Text style={styles.label}>Vehicle</Text>
                <Text style={styles.value}>{tripData.plateNumber || 'N/A'}</Text>
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.label}>Make/Model</Text>
                <Text style={styles.value}>
                  {tripData.make || ''} {tripData.model || ''}
                </Text>
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.label}>Purpose</Text>
                <Text style={styles.value}>{tripData.purpose || 'N/A'}</Text>
              </View>
              <View style={styles.tripInfo}>
                <Text>✓ Started {new Date(tripData.checkInTime).toLocaleString()}</Text>
                <Text>✓ {tripData.locationStart || 'Unknown location'}</Text>
                <Text>✓ Start Odometer: {tripData.odometerStart || '0'} km</Text>
              </View>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={() => handleNavigation('/log-fuel', {
              tripId: tripData.tripId,
              vehicleId: tripData.vehicleId,
            })}
            style={styles.button}
            disabled={!tripData.tripId || !tripData.vehicleId}
          >
            Log Fuel
          </Button>

          <Button
            mode="outlined"
            onPress={() => handleNavigation('/check-out', {
              tripId: tripData.tripId,
              vehicleId: tripData.vehicleId,
              driverId: tripData.driverId
            })}
            style={styles.button}
            // disabled={!tripData.tripId || !tripData.vehicleId || !tripData.driverId}
          >
            Check Out Vehicle
          </Button>
        </>
      ) : assignment ? (
        <>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitle}>
                Vehicle Assignment
              </Text>

              <View style={styles.vehicleInfo}>
                <Text style={styles.labelAssigned}>Plate Number</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{assignment.plateNumber || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.vehicleInfo}>
                <Text style={styles.labelAssigned}>Make/Model</Text>
                <Text style={styles.value}>
                  {assignment.make || ''} {assignment.model || ''}
                </Text>
              </View>

              <View style={styles.vehicleInfo}>
                <Text style={styles.labelAssigned}>Assigned At</Text>
                <Text style={styles.value}>
                  {assignment.assignedAt 
                    ? new Date(assignment.assignedAt).toLocaleDateString() 
                    : 'N/A'}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={() => handleNavigation('/check-in')}
            style={styles.button}
          >
            Check In Vehicle
          </Button>
        </>
      ) : (
        !error && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitle}>Vehicle Status</Text>
              <Text variant="bodyMedium" style={styles.cardText}>
                No Vehicle Assignment
              </Text>
              <Button 
                mode="text" 
                onPress={fetchData}
                style={styles.refreshButton}
              >
                Refresh Status
              </Button>
            </Card.Content>
          </Card>
        )
      )}

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.button}
      >
        Logout
      </Button>
    </View>
  );
};

// Prop type validation
DashboardScreen.propTypes = {
  navigation: PropTypes.object,
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  welcomeText: { 
    marginBottom: 20, 
    fontWeight: 'bold' 
  },
  card: { 
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  errorCard: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FFCCCC'
  },
  cardTitle: { 
    marginBottom: 30, 
    fontWeight: 'bold' 
  },
  cardText: { 
    marginBottom: 10 
  },
  vehicleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: { 
    fontWeight: 'bold' 
  },
  labelAssigned: { 
    color: '#757575' 
  },
  value: { 
    flex: 1, 
    textAlign: 'right',
    fontWeight: '700'
  },
  tripInfo: { 
    marginTop: 15 
  },
  button: { 
    marginTop: 10, 
    paddingVertical: 5 
  },
  refreshButton: {
    marginTop: 10
  },
  retryButton: {
    marginTop: 10
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10
  },
  badge: {
    backgroundColor: '#eff6ff', // bg-blue-50 equivalent
    borderWidth: 1,
    borderColor: '#bfdbfe', // border-blue-200 equivalent
    borderRadius: 4, // optional for rounded corners
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start', // makes the badge only as wide as its content
  },
  badgeText: {
    color: '#1d4ed8', // text-blue-700 equivalent
    fontSize: 12,
    fontWeight: '500', // semi-bold
  },
});

export default DashboardScreen;