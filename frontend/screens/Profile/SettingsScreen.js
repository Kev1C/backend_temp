// frontend/screens/Profile/SettingsScreen.js

import React, { useContext } from 'react';
import { View, Alert, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Text, Button, Divider, Card } from 'react-native-paper';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import getStyles from './SettingsScreen.styles';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SettingsScreen = () => {
  const { theme } = useContext(ThemeContext);
  const { signOut, user } = useAuthStore();
  const navigation = useNavigation();
  const styles = getStyles(theme);

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

  const renderUserStat = (label, value, icon) => (
    <Card style={styles.statCard}>
      <Card.Content style={styles.statContent}>
        <MaterialCommunityIcons name={icon} size={24} color={theme.colors.primary} />
        <View style={styles.statTextContainer}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  const navigateToResources = () => navigation.navigate('Resources');
  const navigateToConnect = () => navigation.navigate('Friends');
  const navigateToCalculator = () => navigation.navigate('Calculator');
  const navigateToCommunity = () => navigation.navigate('Community');
  const navigateToExercises = () => navigation.navigate('Exercises');
  const navigateToWorkoutHeatmap = () => navigation.navigate('WorkoutHeatmap');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Settings Header */}
        <Text style={styles.header}>Settings</Text>

        {/* User Stats Section */}
        <View style={styles.statsContainer}>
          {renderUserStat('Age', user?.age || '--', 'calendar')}
          {renderUserStat('Height', user?.height ? `${user.height} cm` : '--', 'human-male-height')}
          {renderUserStat('Weight', user?.weight ? `${user.weight} kg` : '--', 'weight')}
        </View>

        <Divider style={styles.divider} />

        {/* Resources Button */}
        <TouchableOpacity style={styles.button} onPress={navigateToResources}>
          <Text style={styles.buttonText}>Resources</Text>
        </TouchableOpacity>

        {/* Connect Button */}
        <TouchableOpacity style={styles.button} onPress={navigateToConnect}>
          <Text style={styles.buttonText}>Connect</Text>
        </TouchableOpacity>

        {/* Calculator Button */}
        <TouchableOpacity style={styles.button} onPress={navigateToCalculator}>
          <Text style={styles.buttonText}>Calculator</Text>
        </TouchableOpacity>

        {/* Community Button */}
        <TouchableOpacity style={styles.button} onPress={navigateToCommunity}>
          <Text style={styles.buttonText}>Community</Text>
        </TouchableOpacity>

        {/* Exercises Button */}
        <TouchableOpacity style={styles.button} onPress={navigateToExercises}>
          <Text style={styles.buttonText}>Exercises</Text>
        </TouchableOpacity>

        {/* Workout Heatmap Button */}
        <TouchableOpacity style={styles.button} onPress={navigateToWorkoutHeatmap}>
          <Text style={styles.buttonText}>Workout Heatmap</Text>
        </TouchableOpacity>

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
