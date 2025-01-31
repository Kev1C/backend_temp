// SettingsScreen.js

import React, { useContext, useEffect, useState } from 'react';
import { View, Alert, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import { Text, Button, Divider, Card, RadioButton, Portal } from 'react-native-paper';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import getStyles from './SettingsScreen.styles';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDiamondStore } from '../../stores/diamondStore';
import AdComponent from '../../Components/AdComponent';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GOALS = [
  {
    id: 'lose_weight',
    title: 'Lose weight',
    subtitle: 'Burn fat & get lean',
    icon: 'fire',
  },
  {
    id: 'get_fitter',
    title: 'Get fitter',
    subtitle: 'Tone up & feel healthy',
    icon: 'heart-pulse',
  },
  {
    id: 'gain_muscle',
    title: 'Gain muscles',
    subtitle: 'Build mass & strength',
    icon: 'dumbbell',
  },
];

const ACTIVITY_LEVELS = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    subtitle: 'Little to no exercise',
    icon: 'seat',
  },
  {
    id: 'lightly_active',
    title: 'Lightly Active',
    subtitle: 'Light exercise 1-3 days/week',
    icon: 'walk',
  },
  {
    id: 'moderately_active',
    title: 'Moderately Active',
    subtitle: 'Moderate exercise 3-5 days/week',
    icon: 'run',
  },
  {
    id: 'very_active',
    title: 'Very Active',
    subtitle: 'Hard exercise 6-7 days/week',
    icon: 'weight-lifter',
  },
];

const SettingsScreen = () => {
  const { theme } = useContext(ThemeContext);
  const { signOut, user, updateUserData, loading } = useAuthStore();
  const navigation = useNavigation();
  const styles = getStyles(theme);

  const { saveOnboardingData, onboardingData } = useOnboardingStore();
  const { balance, fetchBalance, addDiamonds } = useDiamondStore();
  const { authToken } = useAuthStore();
  const [selectedGoal, setSelectedGoal] = useState(onboardingData?.fitnessGoal || 'get_fitter');
  const [selectedActivity, setSelectedActivity] = useState(onboardingData?.activityLevel || 'moderately_active');
  const [showAdComponent, setShowAdComponent] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        await updateUserData();
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();

    if (authToken) {
      fetchBalance(authToken);
    }
  }, [authToken]);

  const handleLogout = () => {
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
  };

  const handleAdWatched = async (reward) => {
    const diamondsToAdd = reward.amount || 10;
    try {
      console.log('Adding diamonds:', diamondsToAdd);
      await addDiamonds(diamondsToAdd, authToken);
      console.log('Diamonds added successfully');
      
      await fetchBalance(authToken);
      console.log('Balance refreshed:', balance);
      
      Alert.alert('Success', `You've earned ${diamondsToAdd} diamonds!`);
      setShowAdComponent(false);
    } catch (error) {
      console.error('Error adding diamonds:', error);
      Alert.alert('Error', 'Failed to add diamonds. Please try again.');
    }
  };

  const handleGoalSelection = async (goalId) => {
    try {
      setSelectedGoal(goalId);
      await saveOnboardingData({ fitnessGoal: goalId });
      setShowGoalModal(false);
      Alert.alert('Success', 'Your fitness goal has been updated!');
    } catch (error) {
      console.error('Error saving fitness goal:', error);
      Alert.alert('Error', 'Failed to update your fitness goal. Please try again.');
    }
  };

  const handleActivitySelection = async (activityId) => {
    try {
      setSelectedActivity(activityId);
      await saveOnboardingData({ activityLevel: activityId });
      setShowActivityModal(false);
      Alert.alert('Success', 'Your activity level has been updated!');
    } catch (error) {
      console.error('Error saving activity level:', error);
      Alert.alert('Error', 'Failed to update your activity level. Please try again.');
    }
  };

  const getCurrentGoal = () => {
    const goal = GOALS.find(g => g.id === selectedGoal);
    return goal ? goal.title : 'Not set';
  };

  const getCurrentActivity = () => {
    const activity = ACTIVITY_LEVELS.find(a => a.id === selectedActivity);
    return activity ? activity.title : 'Not set';
  };

  const renderUserStat = (label, value, icon) => (
    <TouchableOpacity style={styles.settingOption}>
      <View>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingValue}>
          {loading ? 'Loading...' : value}
        </Text>
      </View>
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={theme.colors.text}
      />
    </TouchableOpacity>
  );

  const navigateToResources = () => navigation.navigate('Resources');

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView style={styles.container}>
        {/* Settings Header */}
        <View style={[styles.headerContainer, { marginTop: Platform.OS === 'ios' ? 0 : 20 }]}>
          <Text style={styles.header}>Settings</Text>
          <View style={styles.diamondContainer}>
            <MaterialCommunityIcons
              name="diamond-stone"
              size={24}
              color="#00FFFF"
            />
            <Text style={styles.diamondText}>{balance}</Text>
          </View>
        </View>

        {/* User Stats Section */}
        <View style={styles.settingsContainer}>
          {renderUserStat('User ID', user?.id || '--', 'account')}
          {renderUserStat('Age', user?.age || '--', 'calendar')}
          {renderUserStat('Height', user?.height ? `${user.height} cm` : '--', 'human-male-height')}
          {renderUserStat('Weight', user?.weight ? `${user.weight} kg` : '--', 'weight')}
        </View>

        <Divider style={styles.divider} />

        {/* Settings Options */}
        <View style={styles.settingsContainer}>
          {/* Fitness Goal Option */}
          <TouchableOpacity 
            style={styles.settingOption} 
            onPress={() => setShowGoalModal(true)}
          >
            <View>
              <Text style={styles.settingLabel}>Fitness Goal</Text>
              <Text style={styles.settingValue}>{getCurrentGoal()}</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>

          {/* Activity Level Option */}
          <TouchableOpacity 
            style={styles.settingOption}
            onPress={() => setShowActivityModal(true)}
          >
            <View>
              <Text style={styles.settingLabel}>Activity Level</Text>
              <Text style={styles.settingValue}>{getCurrentActivity()}</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Fitness Goal Modal */}
        <Portal>
          <Modal
            visible={showGoalModal}
            onDismiss={() => setShowGoalModal(false)}
            transparent
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Fitness Goal</Text>
                  <TouchableOpacity onPress={() => setShowGoalModal(false)}>
                    <MaterialCommunityIcons
                      name="close"
                      size={24}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {GOALS.map((goal) => (
                    <TouchableOpacity
                      key={goal.id}
                      style={[
                        styles.modalOption,
                        selectedGoal === goal.id && styles.selectedModalOption,
                      ]}
                      onPress={() => handleGoalSelection(goal.id)}
                    >
                      <MaterialCommunityIcons
                        name={goal.icon}
                        size={24}
                        color={selectedGoal === goal.id ? theme.colors.surface : theme.colors.text}
                      />
                      <View style={styles.modalOptionText}>
                        <Text 
                          style={[
                            styles.modalOptionTitle,
                            selectedGoal === goal.id && styles.selectedModalText
                          ]}
                        >
                          {goal.title}
                        </Text>
                        <Text 
                          style={[
                            styles.modalOptionSubtitle,
                            selectedGoal === goal.id && styles.selectedModalText
                          ]}
                        >
                          {goal.subtitle}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </Portal>

        {/* Activity Level Modal */}
        <Portal>
          <Modal
            visible={showActivityModal}
            onDismiss={() => setShowActivityModal(false)}
            transparent
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Activity Level</Text>
                  <TouchableOpacity onPress={() => setShowActivityModal(false)}>
                    <MaterialCommunityIcons
                      name="close"
                      size={24}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {ACTIVITY_LEVELS.map((activity) => (
                    <TouchableOpacity
                      key={activity.id}
                      style={[
                        styles.modalOption,
                        selectedActivity === activity.id && styles.selectedModalOption,
                      ]}
                      onPress={() => handleActivitySelection(activity.id)}
                    >
                      <MaterialCommunityIcons
                        name={activity.icon}
                        size={24}
                        color={selectedActivity === activity.id ? theme.colors.surface : theme.colors.text}
                      />
                      <View style={styles.modalOptionText}>
                        <Text 
                          style={[
                            styles.modalOptionTitle,
                            selectedActivity === activity.id && styles.selectedModalText
                          ]}
                        >
                          {activity.title}
                        </Text>
                        <Text 
                          style={[
                            styles.modalOptionSubtitle,
                            selectedActivity === activity.id && styles.selectedModalText
                          ]}
                        >
                          {activity.subtitle}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </Portal>

        <Divider style={styles.divider} />

        {/* Resources Button */}
        <TouchableOpacity style={styles.resourcesButton} onPress={navigateToResources}>
          <MaterialCommunityIcons
            name="book-open-variant"
            size={20}
            color={theme.colors.surface}
          />
          <Text style={styles.resourcesButtonText}>Resources</Text>
        </TouchableOpacity>

        <Divider style={styles.divider} />

        {/* Ad Component */}
        <AdComponent onAdWatched={handleAdWatched} />

        <Divider style={styles.divider} />

        {/* Logout Button */}
        <View style={[styles.logoutContainer, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.logoutContent}>
              <MaterialCommunityIcons
                name="logout"
                size={20}
                color={theme.colors.text}
                style={styles.logoutIcon}
              />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;