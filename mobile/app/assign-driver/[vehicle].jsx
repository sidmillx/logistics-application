import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Alert, ScrollView, KeyboardAvoidingView, TextInput } from 'react-native';
import { Button, Menu, useTheme, Switch } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import API_BASE_URL from '../../config/api';
import { getItem } from '../../utils/storage';
import { Car, Search } from 'lucide-react-native';

export default function AssignDriver() {
  const { vehicle, plateNumber } = useLocalSearchParams(); // expects vehicle to be an ID string
  const [visible, setVisible] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [status, setStatus] = useState('Available');

  const [permanent, setPermanent] = useState(false); // New toggle for permanent assignment
  const [searchQuery, setSearchQuery] = useState('');

  const theme = useTheme();

  const getToken = async () => {
    if (Platform.OS === 'web') {
      return localStorage.getItem('token');
    } else {
      return await getItem('token');
    }
  };

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const token = await getToken();

        const res = await fetch(`${API_BASE_URL}/api/mobile/drivers`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();
        setDrivers(data);
        setFilteredDrivers(data);
      } catch (error) {
        console.error("Failed to load drivers", error);
      }
    };

    fetchDrivers();
  }, []);

  // Filter drivers based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDrivers(drivers);
    } else {
      const filtered = drivers.filter(driver =>
        driver.fullname.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDrivers(filtered);
    }
  }, [searchQuery, drivers]);

  const handleAssign = async () => {
    try {
      const token = await getToken();

      const res = await fetch(`${API_BASE_URL}/api/mobile/supervisor/assignments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driverId: selectedDriver ? selectedDriver.id : null,
          vehicleId: vehicle,
          permanent: permanent, // send permanent status
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        Alert.alert("Assignment Failed", result.error || "An error occurred.");
        return;
      }

      // Success handling with web + mobile support
if (Platform.OS === 'web') {
  alert('Driver assigned to vehicle successfully!');
  router.replace('/(supervisor)/vehicles');
} else {
  Alert.alert(
    'Success',
    'Driver assigned to vehicle successfully!',
    [
      {
        text: 'OK',
        onPress: () => router.replace('/(supervisor)/vehicles'),
      },
    ]
  );
}

    } catch (err) {
      console.error("Assignment error:", err);
      Alert.alert("Error", "Could not assign driver.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.assignmentCard}>
          <View style={styles.assignmentCardHeader}>
            <View style={styles.assignmentIconContainer}>
              <Car />
            </View>
            <Text style={styles.assignmentCardTitle}>Vehicle Details</Text>
          </View>

          <View style={styles.assignmentCardContent}>
            <View style={styles.assignmentVehicleIdContainer}>
              <Text style={styles.assignmentVehicleIdLabel}>Vehicle</Text>
              <Text style={styles.assignmentVehicleIdValue}>
                {plateNumber}
              </Text>
            </View>

            <View style={styles.assignmentStatusContainer}>
              <View style={styles.assignmentStatusIndicator} />
              <Text style={styles.assignmentStatusText}>{status}</Text>
            </View>
          </View>
        </View>

        {/* Driver Selector with Search */}
        <View style={styles.menuContainer}>
          <Menu
            visible={visible}
            onDismiss={() => {
              setVisible(false);
              setSearchQuery(''); // Clear search when menu closes
            }}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setVisible(true)}
                style={styles.menuButton}
                contentStyle={styles.menuButtonContent}
              >
                {selectedDriver ? selectedDriver.fullname : "Select Driver"}
              </Button>
            }
            style={styles.menuStyle}
            contentStyle={styles.menuContent}
          >
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Search size={20} color="#6b7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search drivers..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
            </View>

            <ScrollView
              style={styles.menuScrollView}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {filteredDrivers.length === 0 ? (
                <Text style={styles.noResultsText}>
                  {searchQuery ? 'No drivers found' : 'No drivers available'}
                </Text>
              ) : (
                filteredDrivers.map(driver => (
                  <Menu.Item
                    key={driver.id}
                    title={driver.fullname}
                    onPress={() => {
                      setSelectedDriver(driver);
                      setVisible(false);
                      setSearchQuery('');
                    }}
                    style={styles.menuItem}
                    titleStyle={styles.menuItemText}
                  />
                ))
              )}
            </ScrollView>
          </Menu>
        </View>

        {/* Permanent Toggle */}
        <View style={styles.permanentToggleContainer}>
          <Text style={styles.permanentLabel}>Permanent Assignment</Text>
          <Switch
            value={permanent}
            onValueChange={setPermanent}
            color={theme.colors.primary}
          />
        </View>

        <Button
          mode="contained"
          disabled={!selectedDriver}
          onPress={handleAssign}
          style={styles.assignButton}
        >
          Start Assignment
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20 },
  menuContainer: { minHeight: 60, marginBottom: 20 },
  menuButton: { width: '100%' },
  menuButtonContent: { height: 50, justifyContent: 'center' },
  menuStyle: { marginTop: 50, maxHeight: 400, width: '90%' },
  menuContent: { padding: 0 },
  menuScrollView: { maxHeight: 300},
  // Center dropdown items properly
  menuItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center', // centers content horizontally
    width: '100%'
  },
  menuItemText: {
    fontSize: 16,
    textAlign: 'center', // centers text within its container
    width: '100%',
  },
  assignButton: { marginTop: 10, marginBottom: 30 },
  assignmentCard: {
    borderWidth: 2,
    borderColor: 'rgba(0, 32, 77, 0.2)',
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    padding: 16,
    marginBottom: 20
  },
  assignmentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 32, 77, 0.1)'
  },
  assignmentIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(0, 32, 77, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  assignmentCardTitle: { fontSize: 18, fontWeight: '600', color: '#00204D' },
  assignmentCardContent: { gap: 16 },
  assignmentVehicleIdContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12
  },
  assignmentVehicleIdLabel: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  assignmentVehicleIdValue: {
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: '600',
    color: '#00204D'
  },
  assignmentStatusContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  assignmentStatusIndicator: { width: 8, height: 8, backgroundColor: '#10b981', borderRadius: 4 },
  assignmentStatusText: { color: '#059669', fontWeight: '500' },
  permanentToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  permanentLabel: { fontSize: 16, fontWeight: '500' },

  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  searchIcon: { marginRight: 12 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    borderWidth: 0, // removed outline
    outlineWidth: 0, // remove outline on web
  },
  noResultsText: {
    textAlign: 'center',
    padding: 16,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});
