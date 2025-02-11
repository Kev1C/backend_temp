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
} from 'react-native';
import { useDiamondStore } from '../stores/diamondStore';
import DiamondChest from '../assets/images/cropped.png';
import { useAdStore } from '../stores/adStore';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const modalWidth = screenWidth * 0.85;
const modalHeight = screenHeight * 0.55;

const HomescreenAdComponent = () => {
  const { addDiamonds } = useDiamondStore();
  const { homeAdReady, showHomeRewardedAd, initializeAds } = useAdStore();
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

  return (
    <View>
      <TouchableOpacity onPress={handleChestPress} disabled={!homeAdReady}>
        <Image
          source={DiamondChest}
          style={[styles.chestImage, { opacity: homeAdReady ? 1 : 0.5 }]}
        />
      </TouchableOpacity>

      <Modal visible={showModal} transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Container for positioning the chest */}
            <View style={styles.chestContainer}>
              <Image source={DiamondChest} style={styles.modalTopChest} />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.modalText}>
                Watch an ad to earn more diamonds!
              </Text>
              <Text style={styles.modalText}>
                Unlock the Food Scanner and get detailed nutrition data instantly.
              </Text>
              <TouchableOpacity style={styles.watchAdButton} onPress={handleWatchAd}>
                <Text style={styles.buttonText}>Watch Ad</Text>
              </TouchableOpacity>
            </View>

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
    position: 'relative', // Keep relative positioning
  },
  chestContainer: {
    position: 'absolute', // Position absolutely within modalContent
    top: -70,            // Move it up, partially outside the container.  Adjust this value!
    left: 0,             // Align to the left
    right: 0,            // And the right (for centering)
    alignItems: 'center', // Center the image horizontally within the container
    zIndex: 10,            // Make sure the chest is on top of other content.
  },
  modalTopChest: {
    width: modalWidth * 0.7,
    height: modalHeight * 0.35,
    resizeMode: 'contain',
    // Removed alignSelf: 'center', as it's handled by chestContainer
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
    textAlign: 'center',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 10,
    marginTop: modalHeight * 0.25, // Added marginTop to push content down
  },
});

export default HomescreenAdComponent;