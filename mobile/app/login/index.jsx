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
// import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../config/api';
import { saveItem, clearAll } from '../../utils/storage';
import { useNavigation } from 'expo-router';
//

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
    password: '',
  });



  const clearStorage = async () => {
    await clearAll();
    // Alert.alert('Storage Cleared', 'Storage cleared. Please log in again.');
  };
  



  // const saveItem = async (key, value) => {
  //   if (Platform.OS === 'web') {
  //     localStorage.setItem(key, value);
  //   } else {
  //     await AsyncStorage.setItem(key, value);
  //   }
  // };

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
      await clearStorage(); // Clear any old token

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data?.token || !data?.user) {
        throw new Error('Invalid server response');
      }

      // Save new token & user
      await saveItem('token', data.token);
      await saveItem('user', JSON.stringify(data.user));

      console.log('Logged in user role:', data.user.role);
      console.log('Token:', data.token);

      // Navigate based on role
      if (data.user.role === 'driver') {
        router.replace('/(driver)');
      } else if (data.user.role === 'supervisor') {
        router.replace('/(supervisor)');
      } else {
        Alert.alert('Access Denied', 'Your role is not permitted.');
        await clearStorage();
      }
    } catch (error) {
      console.error('Login error:', error);
      let msg = error.message;
      if (msg.includes('Network request failed')) {
        msg = 'Network error. Please check your connection.';
      }
      Alert.alert('Login Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Image
            source={require('../../assets/images/Inyatsi Logo.png')}
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
  root: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', backgroundColor: '#fff' },
  container: { padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  logo: { width: 150, height: 150, alignSelf: 'center', marginBottom: 30 },
  welcomeText: { textAlign: 'center', marginBottom: 10, fontWeight: 'bold', color: '#333' },
  subtitle: { textAlign: 'center', marginBottom: 30, color: '#666' },
  input: { marginBottom: 5, backgroundColor: '#fff' },
  loginButton: { marginTop: 20, paddingVertical: 4, borderRadius: 4 },
  loginButtonContent: { height: 48 },
  loginButtonLabel: { fontSize: 16 },
  errorText: { color: 'red', marginBottom: 10, marginLeft: 5, fontSize: 12 },
});

export default LoginScreen;
