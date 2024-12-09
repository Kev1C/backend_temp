// frontend/screens/Profile/ProfileScreen.styles.js

import { StyleSheet } from 'react-native';

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 20,
      backgroundColor: theme.colors.background, // Dynamic based on theme
    },
    userInfoSection: {
      paddingHorizontal: 20,
      paddingVertical: 20, // Adjusted padding for alignment
      flexDirection: 'row', // Align items horizontally
      justifyContent: 'space-between', // Space between user info and button
      alignItems: 'center', // Vertically center the items
      backgroundColor: 'transparent',
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      color: theme.colors.text, // Dynamic text color
    },
    caption: {
      fontSize: 16,
      lineHeight: 16,
      marginTop: 5,
      color: theme.colors.text, // Dynamic text color
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background, // Dynamic background
    },
  });

export default getStyles;