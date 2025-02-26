// frontend/screens/Profile/SettingsScreen.js

import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { View, Alert, TouchableOpacity, Platform, Modal, ActivityIndicator } from 'react-native';
import { Text, Divider, Portal, Button } from 'react-native-paper';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import getStyles from './SettingsScreen.styles';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDiamondStore } from '../../stores/diamondStore';
import AdComponent from '../../Components/SettingScreenAdComponent';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from "@shopify/flash-list";
import { useAdStore } from '../../stores/adStore';

const GOALS = [
    { id: 'lose_weight', title: 'Lose weight', subtitle: 'Burn fat & get lean', icon: 'fire' },
    { id: 'get_fitter', title: 'Get fitter', subtitle: 'Tone up & feel healthy', icon: 'heart-pulse' },
    { id: 'gain_muscle', title: 'Gain muscles', subtitle: 'Build mass & strength', icon: 'dumbbell' },
];

const ACTIVITY_LEVELS = [
    { id: 'sedentary', title: 'Sedentary', subtitle: 'Little to no exercise', icon: 'seat' },
    { id: 'lightly_active', title: 'Lightly Active', subtitle: 'Light exercise 1-3 days/week', icon: 'walk' },
    { id: 'moderately_active', title: 'Moderately Active', subtitle: 'Moderate exercise 3-5 days/week', icon: 'run' },
    { id: 'very_active', title: 'Very Active', subtitle: 'Hard exercise 6-7 days/week', icon: 'weight-lifter' },
];

const UserStat = React.memo(({ label, value, icon, theme, styles }) => (
    <View style={styles.settingOption}>
        <View>
            <Text style={styles.settingLabel}>{label}</Text>
            <Text style={styles.settingValue}>{value}</Text>
        </View>
        <MaterialCommunityIcons name={icon} size={24} color={theme.colors.text} />
    </View>
));

const ModalOption = React.memo(({ item, selectedId, onSelect, theme, styles }) => {
    const isSelected = item.id === selectedId;

    return (
        <TouchableOpacity
            style={[styles.modalOption, isSelected && styles.selectedModalOption]}
            onPress={() => onSelect(item.id)}
            accessible={true}
            accessibilityLabel={`${item.title}, ${item.subtitle}${isSelected ? ', selected' : ''}`}
        >
            <MaterialCommunityIcons
                name={item.icon}
                size={24}
                color={isSelected ? theme.colors.surface : theme.colors.text}
            />
            <View style={styles.modalOptionText}>
                <Text style={[styles.modalOptionTitle, isSelected && styles.selectedModalText]}>
                    {item.title}
                </Text>
                <Text style={[styles.modalOptionSubtitle, isSelected && styles.selectedModalText]}>
                    {item.subtitle}
                </Text>
            </View>
        </TouchableOpacity>
    );
});

const SettingsScreen = () => {
    const { theme } = useContext(ThemeContext);
    const { signOut, user, updateUserData } = useAuthStore();
    const navigation = useNavigation();
    const { saveOnboardingData, onboardingData } = useOnboardingStore();
    const { balance, fetchBalance, addDiamonds } = useDiamondStore();
    const { authToken } = useAuthStore();
    const [selectedGoal, setSelectedGoal] = useState(onboardingData?.fitnessGoal || 'get_fitter');
    const [tempGoal, setTempGoal] = useState(selectedGoal);
    const [selectedActivity, setSelectedActivity] = useState(onboardingData?.activityLevel || 'moderately_active');
    const [tempActivity, setTempActivity] = useState(selectedActivity);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const insets = useSafeAreaInsets();
    const [isDataLoading, setIsDataLoading] = useState(true);
    const { settingsAdReady } = useAdStore();
    const [showAdModal, setShowAdModal] = useState(false);

    const styles = useMemo(() => getStyles(theme), [theme]);

    useEffect(() => {
        const loadUserData = async () => {
            setIsDataLoading(true);
            try {
                await updateUserData();
                if (authToken) {
                    await fetchBalance(authToken);
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                Alert.alert('Error', 'Failed to load user data. Please try again.', [
                    { text: 'Retry', onPress: loadUserData },
                    { text: 'Cancel', style: 'cancel' },
                ]);
            } finally {
                setIsDataLoading(false);
            }
        };

        loadUserData();
    }, [authToken, updateUserData, fetchBalance]);

    const handleLogout = useCallback(() => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'GenderSelection' }],
                        });
                    },
                },
            ],
            { cancelable: true }
        );
    }, [signOut, navigation]);

    const handleAdWatched = useCallback(async (reward) => {
        const diamondsToAdd = reward.amount || 75;
        try {
            await addDiamonds(diamondsToAdd, authToken);
            await fetchBalance(authToken);
            Alert.alert('Success', `You've earned ${diamondsToAdd} diamonds!`);
        } catch (error) {
            console.error('Error adding diamonds:', error);
            Alert.alert('Error', 'Failed to add diamonds. Please try again.');
        }
    }, [addDiamonds, authToken, fetchBalance]);

    const handleGoalSelection = useCallback(async () => {
        try {
            setSelectedGoal(tempGoal);
            await saveOnboardingData({ fitnessGoal: tempGoal });
            setShowGoalModal(false);
            Alert.alert('Success', 'Your fitness goal has been updated!');
        } catch (error) {
            console.error('Error saving fitness goal:', error);
            Alert.alert('Error', 'Failed to update your fitness goal. Please try again.');
        }
    }, [tempGoal, saveOnboardingData]);

    const handleActivitySelection = useCallback(async () => {
        try {
            setSelectedActivity(tempActivity);
            await saveOnboardingData({ activityLevel: tempActivity });
            setShowActivityModal(false);
            Alert.alert('Success', 'Your activity level has been updated!');
        } catch (error) {
            console.error('Error saving activity level:', error);
            Alert.alert('Error', 'Failed to update your activity level. Please try again.');
        }
    }, [tempActivity, saveOnboardingData]);

    const getCurrentGoal = useCallback(() => {
        const goal = GOALS.find((g) => g.id === selectedGoal);
        return goal ? goal.title : 'Not set';
    }, [selectedGoal]);

    const getCurrentActivity = useCallback(() => {
        const activity = ACTIVITY_LEVELS.find((a) => a.id === selectedActivity);
        return activity ? activity.title : 'Not set';
    }, [selectedActivity]);

    const navigateToResources = useCallback(() => navigation.navigate('Resources'), [navigation]);

    const renderModalContent = useCallback((data, selectedId, onSelect, type, onSave) => {
        const closeModal = type === 'Fitness Goal' ? setShowGoalModal : setShowActivityModal;
        return (
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select {type}</Text>
                    <TouchableOpacity onPress={() => closeModal(false)}>
                        <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
                <FlashList
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ModalOption item={item} selectedId={selectedId} onSelect={onSelect} theme={theme} styles={styles} />
                    )}
                    estimatedItemSize={80}
                />
                <View style={styles.modalFooter}>
                    <Button
                        mode="contained"
                        onPress={onSave}
                        style={styles.modalSaveButton}
                        labelStyle={{ color: theme.colors.surface }}
                    >
                        Save
                    </Button>
                </View>
            </View>
        );
    }, [styles, theme]);

    if (isDataLoading) {
        return (
            <View style={[styles.safeArea, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 10 }}>Loading user data...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.safeArea, { paddingTop: insets.top }]}>
            <View style={styles.container}>
                <View style={[styles.headerContainer, { marginTop: Platform.OS === 'ios' ? 0 : 20 }]}>
                    <Text style={styles.header}>Settings</Text>
                    <TouchableOpacity
                        style={styles.diamondContainer}
                        onPress={() => {
                            if (settingsAdReady) {
                                setShowAdModal(true);
                            } else {
                                Alert.alert('Ad not ready', 'Please wait for the ad to load.');
                            }
                        }}
                        disabled={!settingsAdReady}
                        accessible={true}
                        accessibilityLabel="Press to watch ad and earn diamonds"
                        accessibilityHint="Earn diamonds by watching an ad"
                    >
                        <MaterialCommunityIcons name="diamond-stone" size={24} color="#00FFFF" />
                        <Text style={styles.diamondText}>{balance}</Text>
                        <View style={styles.plusButton}>
                            <MaterialCommunityIcons name="plus" size={16} color={theme.colors.surface} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.settingsContainer}>
                    {/* <UserStat label="User ID" value={user?.id || '--'} icon="account" theme={theme} styles={styles} />
                    <UserStat label="Age" value={user?.age || '--'} icon="calendar" theme={theme} styles={styles} /> */}
                    <UserStat label="Height" value={user?.height ? `${user.height} cm` : '--'} icon="human-male-height" theme={theme} styles={styles} />
                    <UserStat label="Weight" value={user?.weight ? `${user.weight} kg` : '--'} icon="weight" theme={theme} styles={styles} />
                </View>

                <Divider style={styles.divider} />

                <View style={styles.settingsContainer}>
                    <TouchableOpacity
                        style={styles.settingOption}
                        onPress={() => setShowGoalModal(true)}
                        accessible={true}
                        accessibilityLabel={`Fitness Goal, currently set to ${getCurrentGoal()}`}
                        accessibilityHint="Tap to change your fitness goal"
                    >
                        <View>
                            <Text style={styles.settingLabel}>Fitness Goal</Text>
                            <Text style={styles.settingValue}>{getCurrentGoal()}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.settingOption}
                        onPress={() => setShowActivityModal(true)}
                        accessible={true}
                        accessibilityLabel={`Activity Level, currently set to ${getCurrentActivity()}`}
                        accessibilityHint="Tap to change your activity level"
                    >
                        <View>
                            <Text style={styles.settingLabel}>Activity Level</Text>
                            <Text style={styles.settingValue}>{getCurrentActivity()}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <Portal>
                    <Modal visible={showGoalModal} onDismiss={() => setShowGoalModal(false)} transparent animationType="slide">
                        <View style={styles.modalContainer}>
                            {renderModalContent(GOALS, tempGoal, setTempGoal, 'Fitness Goal', handleGoalSelection)}
                        </View>
                    </Modal>
                </Portal>

                <Portal>
                    <Modal visible={showActivityModal} onDismiss={() => setShowActivityModal(false)} transparent animationType="slide">
                        <View style={styles.modalContainer}>
                            {renderModalContent(ACTIVITY_LEVELS, tempActivity, setTempActivity, 'Activity Level', handleActivitySelection)}
                        </View>
                    </Modal>
                </Portal>

                <Divider style={styles.divider} />

                <TouchableOpacity style={styles.resourcesButton} onPress={navigateToResources}>
                    <MaterialCommunityIcons name="book-open-variant" size={20} color={theme.colors.surface} />
                    <Text style={styles.resourcesButtonText}>Resources</Text>
                </TouchableOpacity>

                <Divider style={styles.divider} />

                <AdComponent
                    balance={balance}
                    showModal={showAdModal}
                    setShowModal={setShowAdModal}
                    onAdWatched={handleAdWatched}
                />

                {/* Add user ID text at the bottom left with grey color */}
                <Text style={{ position: 'absolute', bottom: 20, left: 20, color: 'grey' }}>
                    User ID: {user?.id || '--'}
                </Text>
            </View>
        </View>
    );
};

export default SettingsScreen;
