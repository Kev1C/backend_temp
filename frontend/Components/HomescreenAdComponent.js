// frontend/Components/HomescreenAdComponent.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  Text,
  Alert,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { useDiamondStore } from '../stores/diamondStore';
import DiamondChest from '../assets/images/cropped.png';
import { useAdStore } from '../stores/adStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const modalWidth = screenWidth * 0.85;
const modalHeight = screenHeight * 0.55;

const HomescreenAdComponent = () => {
  const { addDiamonds } = useDiamondStore();
  const { homeAdReady, showHomeRewardedAd, initializeAds, homeReward } = useAdStore();
  const [showModal, setShowModal] = useState(false);

  // Initialize ads on mount
  useEffect(() => {
    initializeAds?.();
  }, [initializeAds]);

  const handleChestPress = () => {
    if (!homeAdReady) {
      Alert.alert('Please wait', 'Ad is not ready yet.');
      return;
    }
    setShowModal(true);
  };

  const handleWatchAd = async () => {
    await showHomeRewardedAd();
    setShowModal(false);
  };

  // Animation setup
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showModal) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showModal]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setShowModal(false));
  };

  return (
    <View>
      <TouchableOpacity onPress={handleChestPress} disabled={!homeAdReady}>
        <Image
          source={DiamondChest}
          style={[styles.chestImage, { opacity: homeAdReady ? 1 : 0.5 }]}
        />
      </TouchableOpacity>

      <Modal visible={showModal} transparent onRequestClose={handleClose}>
        <Animated.View style={[styles.modalOverlay, { opacity: opacityAnim }]}>
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.chestContainer}>
              <Image source={DiamondChest} style={styles.modalTopChest} />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.modalTitle}>Earn More Diamonds!</Text>
              <Text style={styles.modalSubtitle}>
                Watch a short ad to unlock:
              </Text>
              <View style={styles.rewardContainer}>
                <MaterialCommunityIcons name="diamond-stone" size={24} color="#00FFFF" />
                {/* Use dynamic reward from the adStore */}
                <Text style={styles.rewardText}>{homeReward} Diamonds</Text>
              </View>
              <Text style={styles.benefitText}>
                Use diamonds to unlock the Food Scanner and get detailed nutrition data instantly
              </Text>
              
              <TouchableOpacity 
                style={styles.watchAdButton}
                onPress={handleWatchAd}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="play-circle" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Watch Ad</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleClose}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <MaterialCommunityIcons name="close-circle" size={28} color="#666" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: modalWidth,
    height: modalHeight,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  chestContainer: {
    position: 'absolute',
    top: -80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  modalTopChest: {
    width: modalWidth * 0.7,
    height: modalHeight * 0.35,
    resizeMode: 'contain',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 15,
    marginTop: modalHeight * 0.2,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 16,
    marginBottom: 15,
  },
  rewardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  watchAdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 10,
    zIndex: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
});

export default HomescreenAdComponent;
