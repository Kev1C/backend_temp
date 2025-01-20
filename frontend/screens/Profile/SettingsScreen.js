// SettingsScreen.js

import React, { useContext, useEffect, useState } from 'react';
import { View, Alert, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Text, Button, Divider, Card } from 'react-native-paper';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import getStyles from './SettingsScreen.styles';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDiamondStore } from '../../stores/diamondStore'; // Updated import
import AdComponent from '../../Components/AdComponent';

const SettingsScreen = () => {
  const { theme } = useContext(ThemeContext);
  const { signOut, user, updateUserData, loading } = useAuthStore();
  const navigation = useNavigation();
  const styles = getStyles(theme);

  const { balance, fetchBalance, addDiamonds } = useDiamondStore(); // Updated
  const { authToken } = useAuthStore();
  const [showAdComponent, setShowAdComponent] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        await updateUserData(true);
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
            // Reset navigation to the root
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
    const diamondsToAdd = reward.amount || 10; // Use the reward amount from the ad, fallback to 10
    try {
      console.log('Adding diamonds:', diamondsToAdd);
      await addDiamonds(diamondsToAdd, authToken);
      console.log('Diamonds added successfully');
      
      // Refresh the balance immediately after adding diamonds
      await fetchBalance(authToken);
      console.log('Balance refreshed:', balance);
      
      Alert.alert('Success', `You've earned ${diamondsToAdd} diamonds!`);
      setShowAdComponent(false); // Hide the AdComponent after successfully adding diamonds
    } catch (error) {
      console.error('Error adding diamonds:', error);
      Alert.alert('Error', 'Failed to add diamonds. Please try again.');
    }
  };

  const renderUserStat = (label, value, icon) => (
    <Card style={styles.statCard}>
      <Card.Content style={styles.statContent}>
        <MaterialCommunityIcons name={icon} size={24} color={theme.colors.primary} />
        <View style={styles.statTextContainer}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statValue}>
            {loading ? 'Loading...' : value}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const navigateToResources = () => navigation.navigate('Resources');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Settings Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Settings</Text>
          <View style={styles.diamondContainer}>
            <MaterialCommunityIcons
              name="diamond-stone" // Changed icon to diamond
              size={24}
              color="#00FFFF" // Changed to blue
            />
            <Text style={styles.diamondText}>{balance}</Text>
          </View>
        </View>

        {/* User Stats Section */}
        <View style={styles.statsContainer}>
          {renderUserStat('User ID', user?.id || '--', 'account')}
          {renderUserStat('Age', user?.age || '--', 'calendar')}
          {renderUserStat('Height', user?.height ? `${user.height} cm` : '--', 'human-male-height')}
          {renderUserStat('Weight', user?.weight ? `${user.weight} kg` : '--', 'weight')}
        </View>

        <Divider style={styles.divider} />

        {/* Resources Button */}
        <TouchableOpacity style={styles.button} onPress={navigateToResources}>
          <Text style={styles.buttonText}>Resources</Text>
        </TouchableOpacity>

        <Divider style={styles.divider} />

        {/* Ad Component */}
        <AdComponent onAdWatched={handleAdWatched} />

        <Divider style={styles.divider} />

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
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
    </SafeAreaView>
  );
};

export default SettingsScreen;