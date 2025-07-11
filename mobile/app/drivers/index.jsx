import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

const driversData = [
  { id: '1', name: 'Auxjorie Loyenne Géminité', trips: 'ET Tript', group: 'A' },
  { id: '2', name: "B'hôtel Quad", trips: 'et Tript', group: 'B' },
  { id: '3', name: 'Auxjorie', trips: 'ET Tript', group: 'C' },
  { id: '4', name: 'Lesphonique Dermini', trips: 'ET Tript', group: 'C' },
  { id: '5', name: 'Bannette Guile', trips: 'SG Tript', group: 'D' },
];

export default function DriversScreen() {
  const theme = useTheme();
  
  // Group drivers by their group letter
  const groupedDrivers = driversData.reduce((acc, driver) => {
    if (!acc[driver.group]) {
      acc[driver.group] = [];
    }
    acc[driver.group].push(driver);
    return acc;
  }, {});

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>Drivers</Text>
      
      <FlatList
        data={Object.entries(groupedDrivers)}
        renderItem={({ item: [group, drivers] }) => (
          <Card style={styles.groupCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.groupTitle}>{group}</Text>
              {drivers.map(driver => (
                <View key={driver.id} style={styles.driverItem}>
                  <Text variant="bodyLarge">{driver.name}</Text>
                  <Text variant="bodyMedium" style={styles.tripsText}>{driver.trips}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
        keyExtractor={([group]) => group}
        contentContainerStyle={styles.listContent}
      />
      
      {/* <Button 
        mode="contained" 
        onPress={() => router.push('/drivers/add')}
        style={styles.addButton}
      >
        Add New Driver
      </Button> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  groupCard: {
    marginBottom: 16,
  },
  groupTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  driverItem: {
    marginBottom: 12,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#6200ee',
  },
  tripsText: {
    color: '#666',
  },
  listContent: {
    paddingBottom: 20,
  },
  addButton: {
    marginTop: 16,
  },
});