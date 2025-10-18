// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, Alert, Platform, Image, KeyboardAvoidingView,ScrollView } from 'react-native';
// import { Button, TextInput, Text, useTheme } from 'react-native-paper';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import * as ImagePicker from 'expo-image-picker';
// import axios from 'axios';
// import { jwtDecode } from 'jwt-decode';
// import PropTypes from 'prop-types';
// import API_BASE_URL from '../../config/api';
// import { getItem } from '../../utils/storage';

// // Constants for error messages and configuration
// const ERROR_MESSAGES = {
//   AUTH_ERROR: 'Authentication failed. Please login again.',
//   NETWORK_ERROR: 'Network error. Please check your connection and try again.',
//   SERVER_ERROR: 'Server error. Please try again later.',
//   UPLOAD_ERROR: 'Failed to upload receipt image.',
//   VALIDATION_ERROR: 'Please complete all required fields with valid data.',
//   TOKEN_ERROR: 'Failed to verify your identity.',
//   UNKNOWN_ERROR: 'An unexpected error occurred.',
// };

// const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
// const API_TIMEOUT = 15000; // 15 seconds timeout for API calls

// const LogFuelScreen = () => {
//   const theme = useTheme();
//   const router = useRouter();
//   const { tripId, vehicleId, onSuccess } = useLocalSearchParams();

//   const [formData, setFormData] = useState({
//     litresAdded: '',
//     cost: '',
//     odometer: '',
//     fuelLocation: '',
//     paymentRef: '',
//   });
   
//   const [userInfo, setUserInfo] = useState(null); // { id, role }

//   const [driverId, setDriverId] = useState(null);
//   const [receiptUri, setReceiptUri] = useState(null);
//   const [receiptUrl, setReceiptUrl] = useState(null);
//   const [uploading, setUploading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [token, setToken] = useState(null);

//   const handleApiError = (error, customMessage) => {
//     console.error('LogFuel Error:', error);
    
//     let errorMessage = customMessage || ERROR_MESSAGES.UNKNOWN_ERROR;
    
//     if (error.message.includes('Network request failed')) {
//       errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
//     } else if (error.response?.status >= 500) {
//       errorMessage = ERROR_MESSAGES.SERVER_ERROR;
//     } else if (error.response?.status === 401) {
//       errorMessage = ERROR_MESSAGES.AUTH_ERROR;
//       handleLogout();
//     }
    
//     Alert.alert('Error', errorMessage);
//     return errorMessage;
//   };

//   const handleLogout = async () => {
//     try {
//       if (Platform.OS === 'web') {
//         localStorage.removeItem('token');
//       } else {
//         await getItem('token').then(async (token) => {
//           if (token) await getItem('token');
//         });
//       }
//       router.replace('/');
//     } catch (err) {
//       console.error('Logout error:', err);
//     }
//   };

//   const validateField = (name, value) => {
//     let error = '';
    
//     switch (name) {
//       case 'litresAdded':
//       case 'cost':
//       case 'odometer':
//         if (!value || isNaN(parseFloat(value))) {
//           error = 'Please enter a valid number';
//         } else if (parseFloat(value) <= 0) {
//           error = 'Value must be greater than 0';
//         }
//         break;
//       case 'fuelLocation':
//       case 'paymentRef':
//         if (!value.trim()) {
//           error = 'This field is required';
//         }
//         break;
//       default:
//         break;
//     }
    
//     setErrors(prev => ({ ...prev, [name]: error }));
//     return !error;
//   };

//   const handleChange = (name, value) => {
//     setFormData(prev => ({ ...prev, [name]: value }));
//     validateField(name, value);
//   };

//  useEffect(() => {
//   const getUserInfoFromToken = async () => {
//     try {
//       let token = Platform.OS === 'web'
//         ? localStorage.getItem('token')
//         : await getItem('token');

//       if (!token) {
//         Alert.alert("Error", ERROR_MESSAGES.TOKEN_ERROR);
//         router.replace('/');
//         return;
//       }

//       setToken(token);

//       const decoded = jwtDecode(token);

//       if (!decoded?.id || !decoded?.role) {
//         throw new Error("Invalid token payload");
//       }

//       setDriverId(decoded.id);        // existing usage
//       setUserInfo({ id: decoded.id, role: decoded.role }); // new
//     } catch (err) {
//       handleApiError(err, ERROR_MESSAGES.TOKEN_ERROR);
//     }
//   };

//   getUserInfoFromToken();
// }, []);


//   const pickReceipt = async () => {
//     try {
//       const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
//       if (!permissionResult.granted) {
//         Alert.alert(
//           'Permission Required', 
//           'We need access to your photos to upload receipts.'
//         );
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         quality: 0.8,
//         allowsEditing: true,
//         aspect: [4, 3],
//       });

//       if (!result.canceled && result.assets?.[0]?.uri) {
//         // Check image size
//         if (result.assets[0].fileSize > MAX_IMAGE_SIZE) {
//           Alert.alert(
//             'Image Too Large', 
//             `Please select an image smaller than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`
//           );
//           return;
//         }
//         setReceiptUri(result.assets[0].uri);
//       }
//     } catch (err) {
//       handleApiError(err, 'Failed to pick image. Please try again.');
//     }
//   };

// const uploadReceipt = async () => {
//   if (!receiptUri) return;

//   setUploading(true);

//   try {
//     let fileName, fileType, fileToUpload;

//     if (Platform.OS === 'web') {
//       // For web - get proper file name and type
//       const response = await fetch(receiptUri);
//       const blob = await response.blob();
      
//       // Extract file name from URI or use default
//       const uriParts = receiptUri.split('/');
//       fileName = uriParts.pop() || 'receipt.jpg';
      
//       // Use blob type or detect from filename
//       fileType = blob.type || 'image/jpeg';
      
//       fileToUpload = new File([blob], fileName, { type: fileType });
//     } else {
//       // For mobile - extract proper file extension
//       const uriParts = receiptUri.split('.');
//       const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
      
//       // Map extension to MIME type
//       const mimeTypes = {
//         jpg: 'image/jpeg',
//         jpeg: 'image/jpeg',
//         png: 'image/png',
//         gif: 'image/gif',
//       };
      
//       fileType = mimeTypes[fileExtension] || 'image/jpeg';
//       fileName = `receipt-${Date.now()}.${fileExtension}`;
      
//       fileToUpload = {
//         uri: receiptUri,
//         name: fileName,
//         type: fileType,
//       };
//     }

//     console.log('Uploading file:', { fileName, fileType });

//     const formData = new FormData();
//     formData.append('image', fileToUpload);

//     const res = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//       timeout: API_TIMEOUT,
//     });

//     if (!res.data?.fileUrl) {
//       throw new Error('Invalid response from server');
//     }

//     setReceiptUrl(res.data.fileUrl);
//     Alert.alert('Success', 'Receipt uploaded successfully!');
//   } catch (err) {
//     handleApiError(err, ERROR_MESSAGES.UPLOAD_ERROR);
//     console.error('Upload error:', err.response?.data || err.message);
//   } finally {
//     setUploading(false);
//   }
// };
//   const validateForm = () => {
//     let isValid = true;
//     Object.keys(formData).forEach(key => {
//       if (!validateField(key, formData[key])) {
//         isValid = false;
//       }
//     });
//     return isValid;
//   };

//   const handleSave = async () => {
//     if (!validateForm()) {
//       Alert.alert("Validation Error", ERROR_MESSAGES.VALIDATION_ERROR);
//       return;
//     }

//     if (!driverId || !token) {
//       Alert.alert("Authentication Error", ERROR_MESSAGES.TOKEN_ERROR);
//       return;
//     }

//     if (!tripId || !vehicleId) {
//       Alert.alert("Error", "Missing trip or vehicle information.");
//       return;
//     }

//     setSubmitting(true);

//     try {
//       const response = await fetch(`${API_BASE_URL}/api/mobile/driver/fuel`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           vehicleId,
//           tripId,
//           litres: parseFloat(formData.litresAdded),
//           cost: parseFloat(formData.cost),
//           odometer: parseFloat(formData.odometer),
//           location: formData.fuelLocation,
//           paymentReference: formData.paymentRef,
//           loggedBy: driverId,
//           receiptUrl: receiptUrl || null,
//         }),
//         timeout: API_TIMEOUT,
//       });

      


//       if (!response.ok) {
//         const errData = await response.json().catch(() => ({}));
//         throw new Error(errData.message || 'Failed to save fuel log');
//       }

//       const data = await response.json();

//       const redirectPath =
//             userInfo.role === "supervisor"
//               ? "/(supervisor)/vehicles"
//               : "/(driver)";
      
//     if (Platform.OS === 'web') {
//   router.replace(redirectPath);
// } else {
//   Alert.alert(
//     "Success",
//     "Fuel log saved successfully!",
//     [{
//       text: "OK",
//       onPress: () => {
//         // if (onSuccess) onSuccess();
//         setTimeout(() => router.replace(redirectPath), 300); // <-- small delay fixes crash
//       },
//     }],
//     { cancelable: false }
//   );
// }

//     } catch (err) {
//       handleApiError(err, "Failed to save fuel log. Please try again.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//   <KeyboardAvoidingView 
//     style={styles.keyboardAvoidingView}
//     behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} 
//   >
//     <ScrollView
//       contentContainerStyle={[
//         styles.contentContainer,
//       {backgroundColor: theme.colors.background}
//     ]}
//       style={styles.scrollView}
//       showsVerticalScrollIndicator={false}
//       keyboardShouldPersistTaps="handled"
//       bounces={true}
//     >
//     <Text variant="headlineSmall" style={styles.title}>Log Fuel Entry</Text>
//     <Text variant="bodyMedium" style={styles.subtitle}>Record fuel added to the vehicle</Text>

//       <TextInput
//         label="Litres Added *"
//         value={formData.litresAdded}
//         onChangeText={(text) => handleChange('litresAdded', text)}
//         style={styles.input}
//         mode="outlined"
//         keyboardType="numeric"
//         error={!!errors.litresAdded}
//       />
//       {errors.litresAdded && <Text style={styles.errorText}>{errors.litresAdded}</Text>}

//       <TextInput
//         label="Cost *"
//         value={formData.cost}
//         onChangeText={(text) => handleChange('cost', text)}
//         style={styles.input}
//         mode="outlined"
//         keyboardType="numeric"
//         error={!!errors.cost}
//       />
//       {errors.cost && <Text style={styles.errorText}>{errors.cost}</Text>}

//       <TextInput
//         label="Odometer at Fueling *"
//         value={formData.odometer}
//         onChangeText={(text) => handleChange('odometer', text)}
//         style={styles.input}
//         mode="outlined"
//         keyboardType="numeric"
//         error={!!errors.odometer}
//       />
//       {errors.odometer && <Text style={styles.errorText}>{errors.odometer}</Text>}

//       <TextInput
//         label="Fuel Location *"
//         value={formData.fuelLocation}
//         onChangeText={(text) => handleChange('fuelLocation', text)}
//         style={styles.input}
//         mode="outlined"
//         error={!!errors.fuelLocation}
//       />
//       {errors.fuelLocation && <Text style={styles.errorText}>{errors.fuelLocation}</Text>}

//       <Button 
//         mode="outlined" 
//         onPress={pickReceipt} 
//         style={styles.uploadButton} 
//         icon="camera"
//       >
//         Pick Receipt {receiptUrl && '✓'}
//       </Button>

//       {receiptUri && (
//         <>
//           <Image 
//             source={{ uri: receiptUri }} 
//             style={styles.receiptImage} 
//             resizeMode="contain"
//           />
//           <Button 
//             onPress={uploadReceipt} 
//             mode="contained" 
//             disabled={uploading || !!receiptUrl}
//             loading={uploading}
//             style={styles.uploadButton}
//           >
//             {receiptUrl ? 'Uploaded ✓' : 'Upload Receipt'}
//           </Button>
//         </>
//       )}

//       <TextInput
//         label="Payment Reference *"
//         value={formData.paymentRef}
//         onChangeText={(text) => handleChange('paymentRef', text)}
//         style={styles.input}
//         mode="outlined"
//         error={!!errors.paymentRef}
//       />
//       {errors.paymentRef && <Text style={styles.errorText}>{errors.paymentRef}</Text>}

//       <View style={styles.buttonContainer}>
//         <Button 
//           mode="outlined" 
//           onPress={() => router.replace('/')} 
//           style={styles.button}
//           disabled={submitting}
//         >
//           Cancel
//         </Button>
//         <Button 
//           mode="contained" 
//           onPress={handleSave} 
//           style={styles.button}
//           loading={submitting}
//           disabled={submitting}
//         >
//           {submitting ? 'Saving...' : 'Save'}
//         </Button>
//       </View>
//      </ScrollView>
//      </KeyboardAvoidingView>
//   );
// };

// // Prop type validation
// LogFuelScreen.propTypes = {
//   navigation: PropTypes.object,
//   route: PropTypes.shape({
//     params: PropTypes.shape({
//       tripId: PropTypes.string,
//       vehicleId: PropTypes.string,
//     }),
//   }),
// };

// const styles = StyleSheet.create({
//   keyboardAvoidingView: {
//     flex: 1,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   contentContainer: {
//     padding: 20,
//     paddingBottom: 40, // Extra padding at bottom
    
//   },
//   title: { 
//     marginBottom: 5, 
//     fontWeight: 'bold' 
//   },
//   subtitle: { 
//     marginBottom: 20, 
//     color: '#666' 
//   },
//   input: { 
//     marginBottom: 5 
//   },
//   uploadButton: { 
//     marginBottom: 15 
//   },
//   buttonContainer: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between', 
//     marginTop: 20 
//   },
//   button: { 
//     flex: 1, 
//     marginHorizontal: 5 
//   },
//   receiptImage: { 
//     width: '100%', 
//     height: 200, 
//     marginVertical: 10,
//     borderRadius: 5
//   },
//   errorText: {
//     color: 'red',
//     fontSize: 12,
//     marginBottom: 10,
//     marginTop: -10
//   }
// });

// export default LogFuelScreen;


import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform, Image, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Button, TextInput, Text, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import PropTypes from 'prop-types';
import API_BASE_URL from '../../config/api';
import { getItem } from '../../utils/storage';

// Constants for error messages and configuration
const ERROR_MESSAGES = {
  AUTH_ERROR: 'Authentication failed. Please login again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UPLOAD_ERROR: 'Failed to upload receipt image.',
  VALIDATION_ERROR: 'Please complete all required fields with valid data.',
  TOKEN_ERROR: 'Failed to verify your identity.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const API_TIMEOUT = 15000; // 15 seconds timeout for API calls

const LogFuelScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const { tripId, vehicleId, onSuccess } = useLocalSearchParams();

  const [formData, setFormData] = useState({
    litresAdded: '',
    cost: '',
    odometer: '',
    fuelLocation: '',
    paymentRef: '',
  });
   
  const [userInfo, setUserInfo] = useState(null); // { id, role }

  const [driverId, setDriverId] = useState(null);
  const [receiptUri, setReceiptUri] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [token, setToken] = useState(null);

  const handleApiError = (error, customMessage) => {
    console.error('LogFuel Error:', error);
    
    let errorMessage = customMessage || ERROR_MESSAGES.UNKNOWN_ERROR;
    
    if (error.message?.includes('Network request failed')) {
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
        await getItem('token').then(async (token) => {
          if (token) await getItem('token');
        });
      }
      router.replace('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'litresAdded':
      case 'cost':
      case 'odometer':
        if (!value || isNaN(parseFloat(value))) {
          error = 'Please enter a valid number';
        } else if (parseFloat(value) <= 0) {
          error = 'Value must be greater than 0';
        }
        break;
      case 'fuelLocation':
      case 'paymentRef':
        if (!value.trim()) {
          error = 'This field is required';
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
    const getUserInfoFromToken = async () => {
      try {
        let token = Platform.OS === 'web'
          ? localStorage.getItem('token')
          : await getItem('token');

        if (!token) {
          Alert.alert("Error", ERROR_MESSAGES.TOKEN_ERROR);
          router.replace('/');
          return;
        }

        setToken(token);

        const decoded = jwtDecode(token);

        if (!decoded?.id || !decoded?.role) {
          throw new Error("Invalid token payload");
        }

        setDriverId(decoded.id);        // existing usage
        setUserInfo({ id: decoded.id, role: decoded.role }); // new
      } catch (err) {
        handleApiError(err, ERROR_MESSAGES.TOKEN_ERROR);
      }
    };

    getUserInfoFromToken();
  }, []);

  // Request permissions when component mounts - especially important for iOS
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'ios') {
        try {
          const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
          console.log('Current photo library permission status:', status);
        } catch (err) {
          console.error('Permission check error:', err);
        }
      }
    };

    requestPermissions();
  }, []);

  const pickReceipt = async () => {
    try {
      // iOS-specific permission handling
      if (Platform.OS === 'ios') {
        const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
          const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
          
          if (!permissionResult.granted) {
            Alert.alert(
              'Permission Required', 
              'We need access to your photos to upload receipts. Please enable it in Settings.'
            );
            return;
          }
        }
      } else {
        // Android permission handling
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (!permissionResult.granted) {
          Alert.alert(
            'Permission Required', 
            'We need access to your photos to upload receipts.'
          );
          return;
        }
      }

      // iOS-specific options to prevent crashes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7, // Lower quality for better performance on iOS
        allowsEditing: true,
        aspect: [4, 3],
        // iOS-specific options
        allowsMultipleSelection: false,
        exif: false, // Disable EXIF data to prevent crashes
        base64: false, // Don't include base64 to reduce memory usage
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        // Check image size
        if (result.assets[0].fileSize > MAX_IMAGE_SIZE) {
          Alert.alert(
            'Image Too Large', 
            `Please select an image smaller than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`
          );
          return;
        }
        
        console.log('Image selected:', {
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
          fileSize: result.assets[0].fileSize
        });
        
        setReceiptUri(result.assets[0].uri);
        setReceiptUrl(null); // Reset URL when new image is picked
      }
    } catch (err) {
      console.error('Image picker error:', err);
      
      // More specific error handling for iOS
      if (err.message?.includes('Permissions')) {
        Alert.alert(
          'Permission Error',
          'Please enable photo library access in Settings to upload receipts.'
        );
      } else {
        Alert.alert('Error', 'Failed to pick image. Please try again.');
      }
    }
  };

  const uploadReceipt = async () => {
    if (!receiptUri) return;

    setUploading(true);

    try {
      // For iOS, ensure the URI is properly formatted
      let finalUri = receiptUri;
      
      // iOS sometimes returns file:// URIs that need special handling
      if (Platform.OS === 'ios' && receiptUri.startsWith('file://')) {
        // For iOS, we can use the file URI directly
        finalUri = receiptUri;
      }

      let fileName, fileType, fileToUpload;

      if (Platform.OS === 'web') {
        // For web - get proper file name and type
        const response = await fetch(finalUri);
        const blob = await response.blob();
        
        // Extract file name from URI or use default
        const uriParts = finalUri.split('/');
        fileName = uriParts.pop() || 'receipt.jpg';
        
        // Use blob type or detect from filename
        fileType = blob.type || 'image/jpeg';
        
        fileToUpload = new File([blob], fileName, { type: fileType });
      } else {
        // For mobile - extract proper file extension
        const uriParts = finalUri.split('.');
        const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
        
        // Map extension to MIME type
        const mimeTypes = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          heic: 'image/heic', // Add HEIC support for iOS
          heif: 'image/heif', // Add HEIF support for iOS
        };
        
        fileType = mimeTypes[fileExtension] || 'image/jpeg';
        fileName = `receipt-${Date.now()}.${fileExtension}`;
        
        fileToUpload = {
          uri: finalUri,
          name: fileName,
          type: fileType,
        };
      }

      console.log('Uploading file for iOS:', { fileName, fileType, uri: finalUri });

      const formData = new FormData();
      formData.append('image', fileToUpload);

      const res = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: API_TIMEOUT,
      });

      if (!res.data?.fileUrl) {
        throw new Error('Invalid response from server');
      }

      setReceiptUrl(res.data.fileUrl);
      Alert.alert('Success', 'Receipt uploaded successfully!');
    } catch (err) {
      console.error('Upload error details:', {
        message: err.message,
        response: err.response?.data,
        uri: receiptUri
      });
      
      handleApiError(err, ERROR_MESSAGES.UPLOAD_ERROR);
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    Object.keys(formData).forEach(key => {
      if (!validateField(key, formData[key])) {
        isValid = false;
      }
    });
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", ERROR_MESSAGES.VALIDATION_ERROR);
      return;
    }

    if (!driverId || !token) {
      Alert.alert("Authentication Error", ERROR_MESSAGES.TOKEN_ERROR);
      return;
    }

    if (!tripId || !vehicleId) {
      Alert.alert("Error", "Missing trip or vehicle information.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/driver/fuel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleId,
          tripId,
          litres: parseFloat(formData.litresAdded),
          cost: parseFloat(formData.cost),
          odometer: parseFloat(formData.odometer),
          location: formData.fuelLocation,
          paymentReference: formData.paymentRef,
          loggedBy: driverId,
          receiptUrl: receiptUrl || null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save fuel log');
      }

      const data = await response.json();

      const redirectPath =
            userInfo?.role === "supervisor"
              ? "/(supervisor)/vehicles"
              : "/(driver)";
      
      if (Platform.OS === 'web') {
        router.replace(redirectPath);
      } else {
        Alert.alert(
          "Success",
          "Fuel log saved successfully!",
          [{
            text: "OK",
            onPress: () => {
              setTimeout(() => router.replace(redirectPath), 300);
            },
          }],
          { cancelable: false }
        );
      }

    } catch (err) {
      handleApiError(err, "Failed to save fuel log. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { backgroundColor: theme.colors.background }
        ]}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        alwaysBounceVertical={false}
      >
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>Log Fuel Entry</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Record fuel added to the vehicle</Text>

          <TextInput
            label="Litres Added *"
            value={formData.litresAdded}
            onChangeText={(text) => handleChange('litresAdded', text)}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
            error={!!errors.litresAdded}
          />
          {errors.litresAdded && <Text style={styles.errorText}>{errors.litresAdded}</Text>}

          <TextInput
            label="Cost *"
            value={formData.cost}
            onChangeText={(text) => handleChange('cost', text)}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
            error={!!errors.cost}
          />
          {errors.cost && <Text style={styles.errorText}>{errors.cost}</Text>}

          <TextInput
            label="Odometer at Fueling *"
            value={formData.odometer}
            onChangeText={(text) => handleChange('odometer', text)}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
            error={!!errors.odometer}
          />
          {errors.odometer && <Text style={styles.errorText}>{errors.odometer}</Text>}

          <TextInput
            label="Fuel Location *"
            value={formData.fuelLocation}
            onChangeText={(text) => handleChange('fuelLocation', text)}
            style={styles.input}
            mode="outlined"
            error={!!errors.fuelLocation}
          />
          {errors.fuelLocation && <Text style={styles.errorText}>{errors.fuelLocation}</Text>}

          <Button 
            mode="outlined" 
            onPress={pickReceipt} 
            style={[
              styles.uploadButton,
              Platform.OS === 'ios' && styles.iosUploadButton
            ]} 
            icon="camera"
          >
            Pick Receipt {receiptUrl && '✓'}
          </Button>

          {receiptUri && (
            <>
              <Image 
                source={{ uri: receiptUri }} 
                style={styles.receiptImage} 
                resizeMode="contain"
              />
              <Button 
                onPress={uploadReceipt} 
                mode="contained" 
                disabled={uploading || !!receiptUrl}
                loading={uploading}
                style={styles.uploadButton}
              >
                {receiptUrl ? 'Uploaded ✓' : 'Upload Receipt'}
              </Button>
            </>
          )}

          <TextInput
            label="Payment Reference *"
            value={formData.paymentRef}
            onChangeText={(text) => handleChange('paymentRef', text)}
            style={styles.input}
            mode="outlined"
            error={!!errors.paymentRef}
          />
          {errors.paymentRef && <Text style={styles.errorText}>{errors.paymentRef}</Text>}

          <View style={styles.buttonContainer}>
            <Button 
              mode="outlined" 
              onPress={() => router.back()} 
              style={styles.button}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSave} 
              style={styles.button}
              loading={submitting}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Prop type validation
LogFuelScreen.propTypes = {
  navigation: PropTypes.object,
  route: PropTypes.shape({
    params: PropTypes.shape({
      tripId: PropTypes.string,
      vehicleId: PropTypes.string,
    }),
  }),
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40, // Extra padding at bottom
    minHeight: '100%',
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
  uploadButton: { 
    marginBottom: 15 
  },
  iosUploadButton: {
    borderWidth: 1, // Better border visibility on iOS
  },
  buttonContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 20,
    marginBottom: 20,
  },
  button: { 
    flex: 1, 
    marginHorizontal: 5 
  },
  receiptImage: { 
    width: '100%', 
    height: 200, 
    marginVertical: 10,
    borderRadius: 8, // Slightly larger border radius for iOS
    backgroundColor: '#f5f5f5', // Background color for loading state
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    marginTop: -10
  }
});

export default LogFuelScreen;