import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Button, TextInput, Text, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/api';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
    password: '',
  });

  // Secure token storage
  const saveToken = async (key, value) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error saving token:', error);
      throw new Error('Failed to save authentication data');
    }
  };

  // Input validation
  const validateInputs = () => {
    const newErrors = {
      username: !username ? 'Username is required' : '',
      password: !password ? 'Password is required' : password.length < 6 ? 'Password must be at least 6 characters' : '',
    };
    setErrors(newErrors);
    return !newErrors.username && !newErrors.password;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          username: username.trim(), 
          password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Invalid username or password');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(data.message || 'Login failed');
        }
      }

      if (!data?.token || !data?.user) {
        throw new Error('Invalid server response');
      }

      // Save tokens securely
      await Promise.all([
        saveToken('token', data.token),
        saveToken('user', JSON.stringify(data.user)),
      ]);

      // Role-based navigation with additional checks
      switch (data.user.role) {
        case 'driver':
          router.replace('/(driver)');
          break;
        case 'supervisor':
          router.replace('/(supervisor)');
          break;
        default:
          Alert.alert(
            'Access Denied',
            'Your account does not have access to this application.',
            [
              { text: 'OK', onPress: () => {
                // Clear stored credentials if role is invalid
                if (Platform.OS === 'web') {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                } else {
                  AsyncStorage.multiRemove(['token', 'user']);
                }
              }}
            ]
          );
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // User-friendly error messages
      let errorMessage = error.message;
      if (error.message.includes('Network request failed')) {
        errorMessage = 'Network error. Please check your connection.';
      }

      Alert.alert(
        'Login Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#fff" 
      />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Image
            source={require('../assets/images/inyatsi-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text variant="headlineMedium" style={styles.welcomeText}>
            Welcome to Inyatsi Logistics
          </Text>

          <Text variant="bodyMedium" style={styles.subtitle}>
            Track trips. Log fuel. Stay connected.
          </Text>

          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            mode="outlined"
            autoCapitalize="none"
            autoCorrect={false}
            error={!!errors.username}
            disabled={loading}
          />
          {errors.username ? (
            <Text style={styles.errorText}>{errors.username}</Text>
          ) : null}

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            style={styles.input}
            mode="outlined"
            autoCapitalize="none"
            error={!!errors.password}
            disabled={loading}
            right={
              <TextInput.Icon
                icon={secureTextEntry ? 'eye-off' : 'eye'}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
                disabled={loading}
              />
            }
          />
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            disabled={loading}
            loading={loading}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
            labelStyle={styles.loginButtonLabel}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    marginBottom: 5,
    backgroundColor: '#fff',
  },
  loginButton: {
    marginTop: 20,
    paddingVertical: 8,
    borderRadius: 4,
  },
  loginButtonContent: {
    height: 48,
  },
  loginButtonLabel: {
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    marginLeft: 5,
    fontSize: 12,
  },
});

export default LoginScreen;