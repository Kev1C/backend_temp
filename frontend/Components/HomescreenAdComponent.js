// frontend/Components/HomescreenAdComponent.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  Text,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import DiamondChest from '../assets/images/cropped.png';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const modalWidth = screenWidth * 0.85; // 85% of screen width
const modalHeight = screenHeight * 0.55; // 55% of screen height

const HomescreenAdComponent = () => {
  // State to track ad readiness, rewarded ad instance and modal visibility
  const [adReady, setAdReady] = useState(false);
  const [rewardedAd, setRewardedAd] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Use test IDs during development.
  // When in production, use process.env.GOOGLE_ADMOB_ANDROID_REWARDED_HomeScreen on Android.
  const adUnitId =
    __DEV__
      ? TestIds.REWARDED
      : Platform.OS === 'ios'
      ? 'YOUR_IOS_REWARDED_AD_UNIT_ID'
      : process.env.GOOGLE_ADMOB_ANDROID_REWARDED_HomeScreen;

  useEffect(() => {
    // Create the rewarded ad instance
    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      // Optionally add keywords
      keywords: ['fitness', 'health', 'workout', 'exercise'],
    });
    setRewardedAd(rewarded);

    // Listen for when the ad is loaded
    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log('Rewarded ad loaded');
        setAdReady(true);
      }
    );

    // Listen for reward earned by the user
    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        console.log('User earned reward: ', reward);
        // Here you could call a callback or update state to add diamonds to the user’s account
      }
    );

    // Listen for when the ad is closed
    const unsubscribeClosed = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('Rewarded ad closed');
        setAdReady(false);
        // Reload a new ad after the previous one is closed
        rewarded.load();
        setShowModal(false);
      }
    );

    // Listen for ad errors
    const unsubscribeError = rewarded.addAdEventListener(
      AdEventType.ERROR,
      error => {
        console.error('Rewarded ad error:', error);
        setAdReady(false);
        // Try to load a new ad after a delay
        setTimeout(() => {
          rewarded.load();
        }, 1000);
      }
    );

    // Initially load the ad
    rewarded.load();

    // Clean up event listeners on unmount
    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [adUnitId]);

  // Function to show the rewarded ad when the user taps "Watch Ad"
  const showRewardedAd = async () => {
    if (!rewardedAd || !adReady) {
      Alert.alert('Ad not ready', 'Please wait for the ad to load.');
      return;
    }
    try {
      await rewardedAd.show();
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      Alert.alert('Error', 'Failed to show ad. Please try again.');
    }
  };

  // When the treasure chest is pressed, only open the modal if the ad is ready
  const handleChestPress = () => {
    if (!adReady) {
      Alert.alert('Please wait', 'Ad is not ready yet.');
      return;
    }
    setShowModal(true);
  };

  return (
    <View>
      {/* Treasure chest button */}
      <TouchableOpacity onPress={handleChestPress} disabled={!adReady}>
        <Image
          source={DiamondChest}
          style={[styles.chestImage, { opacity: adReady ? 1 : 0.5 }]}
        />
      </TouchableOpacity>

      {/* Ad Modal */}
      <Modal visible={showModal} transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Watch an ad to earn more diamonds!
            </Text>
            <Text style={styles.modalText}>
              Unlock the Food Scanner and get detailed nutrition data instantly.
            </Text>
            <TouchableOpacity style={styles.watchAdButton} onPress={showRewardedAd}>
              <Text style={styles.buttonText}>Watch Ad</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  chestImage: {
    width: 58,
    height: 58,
    resizeMode: 'contain',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: modalWidth,
    height: modalHeight,
    backgroundColor: 'white',
    padding: screenWidth * 0.05,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalText: {
    marginBottom: screenHeight * 0.015,
    textAlign: 'center',
  },
  watchAdButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: 'black',
    padding: 10,
    borderRadius: 5,
    width: modalWidth * 0.75,
    height: screenHeight * 0.065,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: screenHeight * 0.035,
  },
  buttonText: {
    fontWeight: 'bold',
  },
  closeText: {
    marginTop: 20,
    color: '#007bff',
  },
});

export default HomescreenAdComponent;
