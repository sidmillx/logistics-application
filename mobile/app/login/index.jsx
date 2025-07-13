import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Button, TextInput, Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const theme = useTheme();

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Login Failed", data.message || "Invalid credentials");
        return;
      }

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      const role = data.user.role;

      if (role === "driver") {
        router.replace("/(driver)");
      } else if (role === "supervisor") {
        router.replace("/(supervisor)");
      } else {
        Alert.alert("Unauthorized", "Only drivers and supervisors can use the app.");
      }

    } catch (err) {
      console.error("Login error:", err);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Image 
        source={require('../../assets/images/inyatsi-logo.png')} 
        style={styles.logo}
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
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        mode="outlined"
        right={<TextInput.Icon 
          icon={secureTextEntry ? "eye-off" : "eye"} 
          onPress={() => setSecureTextEntry(!secureTextEntry)}
        />}
      />

      <Button 
        mode="contained" 
        onPress={handleLogin}
        style={styles.loginButton}
      >
        Login
      </Button>

      <TouchableOpacity>
        <Text style={styles.forgotPassword}>Forgot password?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
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
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    marginBottom: 15,
  },
  loginButton: {
    marginTop: 10,
    paddingVertical: 5,
  },
  forgotPassword: {
    marginTop: 15,
    textAlign: 'center',
    color: '#666',
  },
});

export default LoginScreen;
