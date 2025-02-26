// frontend/Components/WelcomeMessageModal.js
import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Animated, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const modalWidth = screenWidth * 0.85;
const modalHeight = screenHeight * 0.55; // Adjusted height for better layout

const WelcomeMessageModal = ({ visible, onClose }) => {
  // Add these animations
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent onRequestClose={handleClose}>
      <Animated.View style={[styles.modalOverlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.chestContainer}>
            <Image source={require('../assets/images/panda_fist_pump.png')} style={styles.modalTopImage} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.modalTitle}>Hooray! You're In!</Text>
            <Text style={styles.modalSubtitle}>Time to take control of your nutrition!</Text>
            <View style={styles.rewardContainer}>
              <MaterialCommunityIcons name="diamond-stone" size={24} color="#00FFFF" />
              <Text style={styles.rewardText}>6500 Diamonds</Text>
            </View>
            <Text style={styles.benefitText}>
              Diamonds unlock our Food Scanner: Use them to instantly analyze your meals with your camera and get detailed nutrition data.
            </Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleClose}>
            <Text style={styles.buttonText}>Got it!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    paddingTop: 60, // Space for the image
    paddingBottom: 20, // Reduced bottom padding
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
    top: -40, // Move the image up
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  modalTopImage: {
    width: modalWidth * 0.7,
    height: modalHeight * 0.3, // Adjusted height for better layout
    resizeMode: 'contain',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 15,
    marginTop: 20, // Adjust margin to position text correctly
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5, // Reduced margin for better spacing
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10, // Reduced margin for better spacing
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    padding: 10, // Adjusted padding for better appearance
    borderRadius: 16,
    marginBottom: 10, // Reduced margin for better spacing
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
    marginBottom: 10, // Reduced margin for better spacing
    lineHeight: 20,
  },
  button: {
    alignSelf: 'center', // Center the button
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 5, // Reduced margin to bring the button closer
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WelcomeMessageModal;
