import { View, StyleSheet } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { router } from 'expo-router';

export default function SupervisorDashboard() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Supervisor Dashboard</Text>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={() => router.push('/vehicles')}
        style={styles.button}
      >
        Manage Vehicles
      </Button>
      
      <Button 
        mode="contained" 
        onPress={() => router.push('/drivers')}
        style={styles.button}
      >
        Manage Drivers
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    marginBottom: 20,
  },
  button: {
    marginVertical: 10,
  }
});