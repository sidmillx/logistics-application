import { View, Text, StyleSheet } from 'react-native';
import { Button, Card, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';

export default function VehicleDetails() {
  const { vehicle } = useLocalSearchParams();
  const theme = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>{vehicle}</Text>
      <Text variant="bodyMedium" style={styles.status}>Assigned</Text>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Current Status:</Text>
          <Text style={styles.cardText}>Last Check-in: Today, 08:30 AM</Text>
          <Text style={styles.cardText}>Current Driver: Luyendra Gumail</Text>
          <Text style={styles.cardText}>Odometer: 45,210km</Text>
        </Card.Content>
      </Card>
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={() => router.push('/check-in')}
          style={styles.button}
        >
          Check-in
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => router.push('/check-out')}
          style={styles.button}
        >
          Check Out
        </Button>
        <Button 
          mode="contained" 
          onPress={() => router.push('/log-fuel')}
          style={styles.button}
        >
          Log Fuel
        </Button>
      </View>
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
  status: {
    marginBottom: 20,
    color: '#666',
  },
  card: {
    marginBottom: 20,
  },
  cardTitle: {
    marginBottom: 10,
    fontWeight: 'bold',
  },
  cardText: {
    marginBottom: 5,
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    marginVertical: 5,
  },
});