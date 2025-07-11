import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Button, TextInput, Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';

const LoginScreen = () => {
  const [driverName, setDriverName] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const theme = useTheme();

  const handleLogin = () => {
  // Temporary mock authentication
    const isSupervisor = driverName.toLowerCase().includes('supervisor');
    
    console.log(`Logging in as: ${driverName}, Supervisor: ${isSupervisor}`);

    if (isSupervisor) {
      router.replace('/(supervisor)');
    } else {
      router.replace('/(driver)');
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
            label="Driver Name"
            value={driverName}
            onChangeText={setDriverName}
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