import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { Button, TextInput, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PropTypes from 'prop-types';
import API_BASE_URL from '../../config/api';

// Constants for error messages and configuration
const ERROR_MESSAGES = {
  AUTH_ERROR: 'Authentication failed. Please login again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please complete all required fields with valid data.',
  ASSIGNMENT_ERROR: 'No vehicle assignment found for this driver.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

const API_TIMEOUT = 30000; // 15 seconds timeout for API calls

const CheckInScreen = () => {
  const router = useRouter();
  const theme = useTheme();
  const { driverId: routeDriverId, onSuccess } = useLocalSearchParams();

  const [assignedVehicle, setAssignedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tripPurpose: '',
    startOdometer: '',
    startLocation: '',
  });
  const [errors, setErrors] = useState({});
  const [userInfo, setUserInfo] = useState(null);
  const [token, setToken] = useState(null);

  const handleApiError = (error, customMessage) => {
    console.error('CheckIn Error:', error);
    
    let errorMessage = customMessage || ERROR_MESSAGES.UNKNOWN_ERROR;
    
    if (error.message.includes('Network request failed')) {
      errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
    } else if (error.response?.status >= 500) {
      errorMessage = ERROR_MESSAGES.SERVER_ERROR;
    } else if (error.response?.status === 401) {
      errorMessage = ERROR_MESSAGES.AUTH_ERROR;
      handleLogout();
    }
    
    Alert.alert('Error', errorMessage);
    return errorMessage;
  };

  const handleLogout = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('token');
      } else {
        await AsyncStorage.removeItem('token');
      }
      router.replace('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const getToken = async () => {
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('token')
        : await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error(ERROR_MESSAGES.AUTH_ERROR);
      }
      
      setToken(token);
      return token;
    } catch (err) {
      handleApiError(err);
      return null;
    }
  };

  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'tripPurpose':
      case 'startLocation':
        if (!value.trim()) {
          error = 'This field is required';
        }
        break;
      case 'startOdometer':
        if (!value.trim()) {
          error = 'Odometer reading is required';
        } else if (isNaN(parseInt(value))) {
          error = 'Must be a valid number';
        } else if (parseInt(value) < 0) {
          error = 'Must be positive';
        }
        break;
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const loadUserAndVehicle = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const [userStr] = await Promise.all([
        AsyncStorage.getItem("user"),
      ]);

      if (!userStr) {
        throw new Error(ERROR_MESSAGES.AUTH_ERROR);
      }

      const user = JSON.parse(userStr);
      setUserInfo(user);

      const idToFetch = routeDriverId || user.id;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const res = await fetch(`${API_BASE_URL}/api/mobile/driver/assignment${user.role === "supervisor" ? `?driverId=${idToFetch}` : ""}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("Raw fetch response:", res);

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error("❌ Failed to parse JSON from assignment response:", jsonErr);
        data = null;
      }

      console.log("Frontend Assignment data loaded:", data);
      console.log("Response status:", res.status);



      if (!res.ok) {
        throw new Error(data.message || ERROR_MESSAGES.ASSIGNMENT_ERROR);
      }

      if (data.message === "No assignment found") {
        Alert.alert('Notice', ERROR_MESSAGES.ASSIGNMENT_ERROR);
        setAssignedVehicle(null);
      } else {
        if (!data.vehicleId) {
          console.warn('Missing vehicleId in assignment data');
        }
        setAssignedVehicle(data);
      }
    } catch (err) {
      handleApiError(err, err.message === "No assignment found" 
        ? ERROR_MESSAGES.ASSIGNMENT_ERROR 
        : "Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserAndVehicle();
  }, []);

  const validateForm = () => {
    let isValid = true;
    Object.keys(formData).forEach(key => {
      if (!validateField(key, formData[key])) {
        isValid = false;
      }
    });
    return isValid;
  };

  const handleCheckIn = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", ERROR_MESSAGES.VALIDATION_ERROR);
      return;
    }

    if (!userInfo || !assignedVehicle?.vehicleId) {
      Alert.alert("Error", "Missing required user or vehicle information.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        vehicleId: assignedVehicle.vehicleId,
        driverId: routeDriverId || userInfo.id,
        performedById: userInfo.id,
        performedByRole: userInfo.role,
        startOdometer: parseInt(formData.startOdometer),
        startLocation: formData.startLocation,
        tripPurpose: formData.tripPurpose,
      };

      console.log("Check-in payload:", payload);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(`${API_BASE_URL}/api/mobile/driver/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Check-in failed');
      }

      const data = await response.json();
      console.log("Check-in successful:", data);
      
      Alert.alert(
        "Success", 
        "Vehicle checked in successfully!",
        [{ text: "OK",  onPress: () => {
            if (onSuccess) onSuccess(); // Call the refresh callback
            router.back();
          } }],
        { cancelable: false }
      );
    } catch (err) {
      handleApiError(err, "Failed to complete check-in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>Vehicle Check-in</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Enter trip details</Text>

      {assignedVehicle ? (
        <TextInput
          label="Assigned Vehicle"
          value={assignedVehicle.plateNumber || 'N/A'}
          style={styles.input}
          mode="outlined"
          editable={false}
        />
      ) : (
        <TextInput
          label="Assigned Vehicle"
          value="No vehicle assigned"
          style={styles.input}
          mode="outlined"
          editable={false}
        />
      )}

      <TextInput
        label="Trip Purpose *"
        value={formData.tripPurpose}
        onChangeText={(text) => handleChange('tripPurpose', text)}
        style={styles.input}
        mode="outlined"
        error={!!errors.tripPurpose}
      />
      {errors.tripPurpose && <Text style={styles.errorText}>{errors.tripPurpose}</Text>}

      <TextInput
        label="Starting Odometer Reading *"
        value={formData.startOdometer}
        onChangeText={(text) => handleChange('startOdometer', text)}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
        error={!!errors.startOdometer}
      />
      {errors.startOdometer && <Text style={styles.errorText}>{errors.startOdometer}</Text>}

      <TextInput
        label="Starting Location *"
        value={formData.startLocation}
        onChangeText={(text) => handleChange('startLocation', text)}
        style={styles.input}
        mode="outlined"
        error={!!errors.startLocation}
      />
      {errors.startLocation && <Text style={styles.errorText}>{errors.startLocation}</Text>}

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.button}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button
          mode="contained"
          onPress={handleCheckIn}
          style={styles.button}
          loading={submitting}
          disabled={submitting || !assignedVehicle?.vehicleId}
        >
          {submitting ? 'Processing...' : 'Check in'}
        </Button>
      </View>
    </View>
  );
};

// Prop type validation
CheckInScreen.propTypes = {
  navigation: PropTypes.object,
  route: PropTypes.shape({
    params: PropTypes.shape({
      driverId: PropTypes.string,
    }),
  }),
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  title: { 
    marginBottom: 5, 
    fontWeight: 'bold' 
  },
  subtitle: { 
    marginBottom: 20, 
    color: '#666' 
  },
  input: { 
    marginBottom: 5 
  },
  buttonContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 20 
  },
  button: { 
    flex: 1, 
    marginHorizontal: 5 
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    marginTop: -10
  }
});

export default CheckInScreen;