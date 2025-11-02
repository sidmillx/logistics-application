import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button, Card, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from "../../config/api";
import PropTypes from 'prop-types';
import { getItem, clearAll } from '../../utils/storage'; // ✅ Use shared storage utils
import { Car, RefreshCw, MapPin, CheckCircle, Settings, Calendar } from 'lucide-react-native'

export const screenOptions = {
  title: 'Dashboard',
};

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
  const [shouldLogout, setShouldLogout] = useState(false);

 const handleApiError = (error, customMessage) => {
  console.error('Dashboard Error:', error);
  
  let errorMessage = customMessage || ERROR_MESSAGES.UNKNOWN_ERROR;
  
  if (error.message.includes('Network request failed')) {
    errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
  } else if (error.response?.status >= 500) {
    errorMessage = ERROR_MESSAGES.SERVER_ERROR;
  } else if (error.response?.status === 401) {
    // Only clear storage and logout for actual auth errors
    errorMessage = ERROR_MESSAGES.AUTH_ERROR;
    Alert.alert('Session Expired', 'Please login again', [{
      text: 'OK',
      onPress: () => {
        clearAll().then(() => router.replace('/login'));
      }
    }]);
    return errorMessage;
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
      getItem('token'),
      getItem('user')
    ]);

    if (!token || !userString) {
      // No token means user is logged out, just return silently
      setLoading(false);
      return;
    }


    const user = JSON.parse(userString);
    setDriverName(user.fullname || user.username || 'Driver');

    const tripRes = await fetchWithTimeout(
      `${API_BASE_URL}/api/mobile/driver/active-trip`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (tripRes.status === 401) {
      throw new Error(ERROR_MESSAGES.AUTH_ERROR);
    }

    if (!tripRes.ok) throw new Error(ERROR_MESSAGES.DATA_ERROR);

    const tripJson = await tripRes.json();
    
    if (tripJson?.tripId) {
      setTripData(tripJson);
      return;
    }

    const assignmentRes = await fetchWithTimeout(
      `${API_BASE_URL}/api/mobile/driver/assignment`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (assignmentRes.status === 401) {
      throw new Error(ERROR_MESSAGES.AUTH_ERROR);
    }

    if (!assignmentRes.ok) throw new Error(ERROR_MESSAGES.DATA_ERROR);

    const assignmentJson = await assignmentRes.json();
    
    if (assignmentJson?.vehicleId) {
      setAssignment(assignmentJson);
    }
  } catch (err) {
    // Only pass auth error message if it's truly an auth error
    const isAuthError = err.message === ERROR_MESSAGES.AUTH_ERROR;
    handleApiError(err, isAuthError ? ERROR_MESSAGES.AUTH_ERROR : ERROR_MESSAGES.DATA_ERROR);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchData();
  }, []);

 const handleLogout = async () => {
    try {
      await clearAll();
      router.replace('/login'); // Navigate to root login
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
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
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
           <Card style={styles.activeTripCard}>
      <Card.Content style={styles.activeTripContent}>
        {/* Card Header */}
        <View style={styles.activeTripHeader}>
          <View style={styles.activeTripIconWrapper}>
            <MapPin size={16} color="#059669" />
          </View>
          <Text style={styles.activeTripTitle}>Active Trip</Text>
        </View>

        {/* Vehicle Info Grid */}
        <View style={styles.activeTripGrid}>
          <View style={styles.activeTripGridColumn}>
            <Text style={styles.activeTripLabel}>Vehicle</Text>
            <Text style={styles.activeTripValue}>{tripData.plateNumber || 'N/A'}</Text>
          </View>
          <View style={styles.activeTripGridColumn}>
            <Text style={styles.activeTripLabel}>Make/Model</Text>
            <Text style={styles.activeTripValue}>
              {tripData.make || ''} {tripData.model || ''}
            </Text>
          </View>
        </View>

        {/* Purpose */}
        <View style={styles.activeTripSingleItem}>
          <Text style={styles.activeTripLabel}>Purpose</Text>
          <Text style={styles.activeTripValue}>{tripData.purpose || 'N/A'}</Text>
        </View>

        {/* Trip Status */}
        <View style={styles.activeTripStatusBox}>
          <View style={styles.activeTripStatusItem}>
            <CheckCircle size={16} color="#059669" />
            <Text style={styles.activeTripStatusText}>
              Started {new Date(tripData.checkInTime).toLocaleString()}
            </Text>
          </View>
          <View style={styles.activeTripStatusItem}>
            <CheckCircle size={16} color="#059669" />
            <Text style={styles.activeTripStatusText}>
              {tripData.locationStart || 'Unknown location'}
            </Text>
          </View>
          <View style={styles.activeTripStatusItem}>
            <CheckCircle size={16} color="#059669" />
            <Text style={styles.activeTripStatusText}>
              Start Odometer: {tripData.odometerStart || '0'} km
            </Text>
          </View>
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
          <Card style={styles.assignmentCard}>
      <Card.Content style={styles.assignmentContent}>
        {/* Card Header */}
        <View style={styles.assignmentHeader}>
          <View style={styles.assignmentIconContainer}>
            <Settings size={16} color="#00204D" />
          </View>
          <Text style={styles.assignmentTitle}>Vehicle Assignment</Text>
        </View>

        {/* Vehicle Info Grid */}
        <View style={styles.assignmentGrid}>
          <View style={styles.assignmentGridItem}>
            <Text style={styles.assignmentLabel}>Plate Number</Text>
            <Text style={styles.assignmentPlate}>{assignment.plateNumber || 'N/A'}</Text>
          </View>
          <View style={styles.assignmentGridItem}>
            <Text style={styles.assignmentLabel}>Make/Model</Text>
            <Text style={styles.assignmentValue}>
              {assignment.make || ''} {assignment.model || ''}
            </Text>
          </View>
        </View>

        {/* Assigned Date */}
        <View style={styles.assignmentDateContainer}>
          <Calendar size={16} color="#6b7280" />
          <View style={styles.assignmentDateText}>
            <Text style={styles.assignmentLabel}>Assigned At</Text>
            <Text style={styles.assignmentValue}>
              {assignment.assignedAt 
                ? new Date(assignment.assignedAt).toLocaleDateString() 
                : 'N/A'}
            </Text>
          </View>
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
        <Card.Content style={styles.cardContent}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Car size={16} color="#00204D" />
            </View>
            <Text style={styles.cardTitle}>Vehicle Status</Text>
          </View>

          {/* Card Content */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>No Vehicle Assignment</Text>
            <Text style={styles.statusSubtext}>
              Contact your supervisor for assignment
            </Text>
          </View>

          {/* Refresh Button */}
          <Button 
            mode="outlined"
            onPress={fetchData}
            style={styles.refreshButton}
            labelStyle={styles.buttonLabel}
            icon={() => <RefreshCw size={16} color="#00204D" />}
          >
            Refresh Status
          </Button>
        </Card.Content>
      </Card>
        )
      )}

      {/* <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.button}
      >
        Logout
      </Button> */}
    </ScrollView>
  );
};

// Prop type validation
DashboardScreen.propTypes = {
  navigation: PropTypes.object,
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scrollContent: { 
    flexGrow: 1,
    padding: 20 
  },
  welcomeText: { 
    marginBottom: 20, 
    fontWeight: 'bold' 
  },
  // card: { 
  //   marginBottom: 20,
  //   backgroundColor: '#fff',
  // },
  errorCard: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FFCCCC'
  },
  // cardTitle: { 
  //   marginBottom: 30, 
  //   fontWeight: 'bold' 
  // },
  // cardText: { 
  //   marginBottom: 10 
  // },
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
    // paddingVertical: 5,
    width: '100%',
    
    paddingVertical: 4, // py-3 equivalent (3 * 4 = 12)
    borderRadius: 12, // rounded-xl
    alignItems: 'center',
    justifyContent: 'center',
  },
  // refreshButton: {
  //   marginTop: 10
  // },
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


  // NEW STYLES
  card: {
    borderWidth: 2,
    borderColor: '#f3f4f6', // gray-100 equivalent
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1, // Android shadow
    backgroundColor: '#fff',
  },
  cardContent: {
    padding: 24,
    gap: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(0, 32, 77, 0.1)', // #00204D/10
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00204D',
  },
  statusContainer: {
    backgroundColor: '#f9fafb', // gray-50 equivalent
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    color: '#4b5563', // gray-600
    fontSize: 16,
    textAlign: 'center',
  },
  statusSubtext: {
    color: '#6b7280', // gray-500
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  refreshButton: {
    borderColor: '#00204D',
    backgroundColor: 'transparent',
  },
  buttonLabel: {
    color: '#00204D',
  },


  // ACTIVE TRIPS
  activeTripCard: {
    borderWidth: 2,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    backgroundColor: 'rgba(220, 252, 231, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeTripContent: {
    padding: 24,
    gap: 16,
  },
  activeTripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    marginBottom: 8,
  },
  activeTripIconWrapper: {
    width: 32,
    height: 32,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTripTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00204D',
  },
  activeTripGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  activeTripGridColumn: {
    flex: 1,
    gap: 4,
  },
  activeTripSingleItem: {
    gap: 4,
    marginBottom: 8,
  },
  activeTripLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeTripValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00204D',
  },
  activeTripStatusBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  activeTripStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeTripStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },





  // ASSIGNMENT
  assignmentCard: {
    borderWidth: 2,
    borderColor: 'rgba(0, 32, 77, 0.2)', // #00204D/20
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  assignmentContent: {
    padding: 24,
    gap: 16,
  },
  assignmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
  },
  assignmentIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(0, 32, 77, 0.1)', // #00204D/10
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00204D',
  },
  assignmentGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  assignmentGridItem: {
    flex: 1,
    gap: 4,
  },
  assignmentLabel: {
    fontSize: 14,
    color: '#6b7280', // gray-500
  },
  assignmentPlate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00204D',
  },
  assignmentValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  assignmentDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  assignmentDateText: {
    gap: 2,
  },
});

export default DashboardScreen;