// frontend/Components/AdComponent.js
import React, { useEffect } from 'react';
import { View, Button, Alert, StyleSheet } from 'react-native';
import { useAdStore } from '../stores/adStore';

const AdComponent = ({ onAdWatched }) => {
  const { settingsAdReady, showSettingsRewardedAd, initializeAds } = useAdStore();

  // Initialize ads if not already done
  useEffect(() => {
    initializeAds?.();
  }, [initializeAds]);

  const handleWatchAd = async () => {
    if (!settingsAdReady) {
      Alert.alert('Ad not ready', 'Please wait for the ad to load.');
      return;
    }
    try {
      await showSettingsRewardedAd();
    } catch (error) {
      Alert.alert('Error', 'Failed to show ad. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={settingsAdReady ? 'Watch Ad to Earn Diamonds' : 'Loading Ad...'}
        onPress={handleWatchAd}
        disabled={!settingsAdReady}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
  },
});

export default AdComponent;
