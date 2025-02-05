import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import DiamondChest from '../assets/images/cropped.png';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const modalWidth = screenWidth * 0.85; //85% of screen width
const modalHeight = screenHeight * 0.55; //55% of screen height

const HomescreenAdComponent = ({ visible, onClose }) => {
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
      <View style={styles.imageContainer}>
        <Image
          source={DiamondChest}
          style={styles.diamondChest}
        />
      </View>
        <Text style={styles.modalText}>
          Watch an ad to earn more diamonds!
        </Text>
        <Text style={styles.modalText}>
          Unlock the Food Scanner and get detailed nutrition data instantly.
        </Text>
        <Text style={styles.modalText}>
          It's the fastest way to log your food!
        </Text>
        <TouchableOpacity style={styles.watchAdButton} onPress={onClose}>
          <Text style={styles.buttonText}>Watch Ad</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: screenWidth * 0.05, //5% of screen width
    textAlign: 'center',
    position: 'relative',
    width: modalWidth,
    height: modalHeight,
    borderWidth: 4,
    borderColor: 'black',
    borderRadius: 20,
    alignItems: 'center', // Center content horizontally
  },
  imageContainer: {
    height: '40%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diamondChest: {
    maxWidth: '80%',
    maxHeight: '80%',
    resizeMode: 'contain',
  },
  modalText: {
    marginBottom: screenHeight * 0.015, //1.5% of screen height
  },
  watchAdButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: 'black',
    padding: 10,
    borderRadius: 5,
    fontWeight: 'bold',
    width: modalWidth * 0.75, //75% of modal width
    height: screenHeight * 0.065, //6.5% of screen height
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: screenHeight * 0.035, //3.5% of screen height
  },
  buttonText: {
    fontWeight: 'bold',
  },
});

export default HomescreenAdComponent;