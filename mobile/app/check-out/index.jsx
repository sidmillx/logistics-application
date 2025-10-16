import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { Button, TextInput, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import PropTypes from 'prop-types';
import API_BASE_URL from '../../config/api';
import {getItem} from '../../utils/storage';

// Constants for error messages and configuration
const ERROR_MESSAGES = {
  AUTH_ERROR: 'Authentication failed. Please login again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please complete all required fields with valid data.',
  TRIP_ERROR: 'No active trip found for checkout.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

const API_TIMEOUT = 15000; // 15 seconds timeout for API calls

const CheckOutScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const { tripId, vehicleId, driverId: routeDriverId, onSuccess } = useLocalSearchParams();

  const [formData, setFormData] = useState({
    endOdometer: '',
    endLocation: '',
  });
  const [errors, setErrors] = useState({});
  const [userInfo, setUserInfo] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleApiError = (error, customMessage) => {
    console.error('CheckOut Error:', error);
    
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
        await getItem('token').then(() => getItem('token', { requireAuthentication: false }));
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
        : await getItem('token');
      
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
      case 'endLocation':
        if (!value.trim()) {
          error = 'End location is required';
        }
        break;
      case 'endOdometer':
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

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) return;

        const decoded = jwtDecode(token);
        setUserInfo({ id: decoded.id, role: decoded.role });

        console.log("Trip ID:", tripId);
        console.log("Vehicle ID:", vehicleId);
        console.log("Route Driver ID:", routeDriverId);

        if (!tripId || !vehicleId) {
          Alert.alert('Error', ERROR_MESSAGES.TRIP_ERROR);
          router.replace('/');
        }
      } catch (error) {
        handleApiError(error, "Failed to load user information");
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
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

const handleCheckOut = async () => {
  if (!validateForm()) {
    Alert.alert("Validation Error", ERROR_MESSAGES.VALIDATION_ERROR);
    return;
  }

  if (!userInfo || !tripId || !vehicleId) {
    Alert.alert("Error", "Missing required trip or vehicle information.");
    return;
  }

  const isSupervisor = userInfo.role === "supervisor";
  if (isSupervisor && !routeDriverId) {
    Alert.alert("Error", "No driver selected for check-out.");
    return;
  }

  setSubmitting(true);

  try {
    const payload = {
      tripId,
      vehicleId,
      driverId: isSupervisor ? routeDriverId : userInfo.id,
      performedById: userInfo.id,
      performedByRole: userInfo.role,
      endOdometer: parseInt(formData.endOdometer),
      endLocation: formData.endLocation,
    };

    console.log("Check-out payload:", payload);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${API_BASE_URL}/api/mobile/driver/checkout`, {
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
      throw new Error(errData.message || 'Check-out failed');
    }

    const data = await response.json();
    console.log("Check-out successful:", data);

    const redirectPath =
      userInfo.role === "supervisor"
        ? "/(supervisor)/vehicles"
        : "/(driver)";
    
    if (Platform.OS === 'web') {
            router.replace(redirectPath);
          } else {
    Alert.alert(
      "Success", 
      "Vehicle checked out successfully!",
      [
        { 
          text: "OK", 
          onPress: () => {
            // if (onSuccess) onSuccess(); // Call the refresh callback
            setTimeout(() => router.replace(redirectPath), 300); // redirect to driver home
          }
        }
      ],
      { cancelable: false } // Prevents dismissing by tapping outside
    );
  }

    // router.replace('/(driver)'); // redirect to driver home
  } catch (err) {
    handleApiError(err, "Failed to complete check-out. Please try again.");
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
      <Text variant="headlineSmall" style={styles.title}>Vehicle Check-Out</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Complete your trip and return the vehicle</Text>

      <TextInput
        label="Ending Odometer Reading *"
        value={formData.endOdometer}
        onChangeText={(text) => handleChange('endOdometer', text)}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
        error={!!errors.endOdometer}
      />
      {errors.endOdometer && <Text style={styles.errorText}>{errors.endOdometer}</Text>}

      <TextInput
        label="Ending Location *"
        value={formData.endLocation}
        onChangeText={(text) => handleChange('endLocation', text)}
        style={styles.input}
        mode="outlined"
        error={!!errors.endLocation}
      />
      {errors.endLocation && <Text style={styles.errorText}>{errors.endLocation}</Text>}

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => router.replace('/')}
          style={styles.button}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button
          mode="contained"
          onPress={handleCheckOut}
          style={styles.button}
          loading={submitting}
          disabled={submitting || !tripId || !vehicleId}
        >
          {submitting ? 'Processing...' : 'Check Out'}
        </Button>
      </View>
    </View>
  );
};

CheckOutScreen.propTypes = {
  navigation: PropTypes.object,
  route: PropTypes.shape({
    params: PropTypes.shape({
      tripId: PropTypes.string.isRequired,
      vehicleId: PropTypes.string.isRequired,
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

export default CheckOutScreen;