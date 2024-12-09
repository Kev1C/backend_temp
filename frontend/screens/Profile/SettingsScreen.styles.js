// frontend/screens/Profile/SettingsScreen.styles.js

import { StyleSheet, Platform, StatusBar } from 'react-native';

const getStyles = (theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
      flex: 1,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.background,
    },
    header: {
      fontSize: 28,
      marginTop: Platform.OS === 'ios' ? 50 : 20,
      marginBottom: 24,
      color: theme.colors.text,
      fontWeight: 'bold',
      paddingHorizontal: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    statCard: {
      flex: 1,
      marginHorizontal: 4,
      elevation: 2,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
    },
    statContent: {
      alignItems: 'center',
      padding: 12,
    },
    statTextContainer: {
      alignItems: 'center',
      marginTop: 8,
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    themeOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderRadius: 8,
      marginVertical: 6,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    selectedThemeOption: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accentLight, // Define in your theme
    },
    themeText: {
      fontSize: 18,
      color: theme.colors.text,
    },
    selectedText: {
      fontSize: 16,
      color: theme.colors.accent,
    },
    divider: {
      backgroundColor: theme.colors.border,
      marginVertical: 20,
    },
    logoutContainer: {
      marginTop: 20,
      paddingHorizontal: 16,
      marginBottom: 30,
    },
    logoutButton: {
      width: '100%',
      paddingVertical: 16,
      borderRadius: 12,
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    logoutContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutIcon: {
      marginRight: 8,
    },
    logoutButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '500',
      letterSpacing: 0.5,
      textAlign: 'center',
    },
  });

export default getStyles;