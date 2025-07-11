import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Menu, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';

const drivers = [
  { id: '1', name: 'Auxjorie Loyenne Géminité', trips: 'ET Tript' },
  { id: '2', name: "B'hôtel Quad", trips: 'et Tript' },
  // ... other drivers
];

export default function AssignDriver() {
  const { vehicle } = useLocalSearchParams();
  const [visible, setVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>{vehicle}</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Ready for assignment</Text>
      
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Button 
            mode="outlined" 
            onPress={() => setVisible(true)}
            style={styles.menuButton}
          >
            {selectedDriver ? selectedDriver.name : "Select Driver"}
          </Button>
        }
      >
        {drivers.map(driver => (
          <Menu.Item 
            key={driver.id}
            title={`${driver.name} (${driver.trips})`}
            onPress={() => {
              setSelectedDriver(driver);
              setVisible(false);
            }}
          />
        ))}
      </Menu>
      
      <Button 
        mode="contained" 
        disabled={!selectedDriver}
        onPress={() => router.back()}
        style={styles.assignButton}
      >
        Start Assignment
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 5,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 20,
    color: '#666',
  },
  menuButton: {
    marginBottom: 20,
  },
  assignButton: {
    marginTop: 10,
  },
});