// frontend/screens/Progress/ProgressScreen.styles.js

import { StyleSheet } from 'react-native';

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 20,
      backgroundColor: theme.colors.background, // Dynamic based on theme
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    noUserContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    noUserText: {
      color: theme.colors.text,
      fontSize: 16,
      textAlign: 'center',
    },
  });

export default getStyles;