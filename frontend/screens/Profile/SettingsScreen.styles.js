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
        divider: {
            marginVertical: 16,
            backgroundColor: theme.colors.border,
        },
        diamondContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 255, 255, 0.1)', // Reverted to original color
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
        plusButton: {
            marginLeft: 4,
            backgroundColor: theme.colors.primary,
            borderRadius: 12,
            padding: 4,
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
            flex: 1,
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
        modalFooter: {
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            alignItems: 'center',
        },
        modalSaveButton: {
            width: '50%',
            backgroundColor: theme.colors.primary,
        },
    });

export default getStyles;