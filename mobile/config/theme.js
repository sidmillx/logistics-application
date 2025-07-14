// config/theme.js
import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#00204D', // dark blue
    secondary: '#FFC107', // yellow
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#000000',
    error: '#B00020',
    // Add/override other colors if needed
  },
};

export default customTheme;
