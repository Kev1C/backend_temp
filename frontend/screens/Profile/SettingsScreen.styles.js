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
            backgroundColor: theme.colors.background,
        },
        headerContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            marginTop: Platform.OS === 'ios' ? 50 : 20,
            marginBottom: 24,
        },
        header: {
            fontSize: 28,
            color: theme.colors.text,
            fontWeight: 'bold',
        },
        settingsContainer: {
            paddingHorizontal: 16,
        },
        settingOption: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        settingLabel: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 4,
        },
        settingValue: {
            fontSize: 14,
            color: theme.colors.text,
            opacity: 0.7,
        },
        sectionContainer: {
            paddingHorizontal: 16,
            marginBottom: 16,
        },
        sectionTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 16,
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
        diamondContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 255, 255, 0.1)',
            padding: 8,
            borderRadius: 20,
            marginRight: 8,
        },
        diamondText: {
            marginLeft: 4,
            color: theme.colors.text,
            fontWeight: 'bold',
            fontSize: 16,
            alignSelf: 'center',
        },
        resourcesButton: {
            backgroundColor: theme.colors.primary,
            marginHorizontal: 16,
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            elevation: 2,
        },
        resourcesButtonText: {
            color: theme.colors.surface,
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 8,
        },
        modalContainer: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            padding: 16,
        },
        modalContent: {
            backgroundColor: theme.colors.background,
            borderRadius: 12,
            maxHeight: '80%',
            flex: 1, // Add this line
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: theme.colors.text,
        },
        modalOption: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        selectedModalOption: {
            backgroundColor: theme.colors.primary,
        },
        modalOptionText: {
            marginLeft: 12,
            flex: 1,
        },
        modalOptionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: 4,
        },
        modalOptionSubtitle: {
            fontSize: 14,
            color: theme.colors.text,
            opacity: 0.7,
        },
        selectedModalText: {
            color: theme.colors.surface,
        },
    });

export default getStyles;