// HomescreenAdComponent.js
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import DiamondChest from '../assets/images/cropped.png';

const HomescreenAdComponent = ({ visible, onClose }) => {
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Image
          source={DiamondChest}
          style={styles.diamondChest}
        />
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
    padding: 20,
    textAlign: 'center',
    position: 'relative',
    width: 331,
    height: 349,
    borderWidth: 4,
    borderColor: 'black',
    borderRadius: 20,
    alignItems: 'center', // Center content horizontally
  },
  diamondChest: {
    width: 200,
    height: 200,
    marginBottom: 20,
    marginTop: -100, // Adjust as needed to position above the text
    resizeMode: 'contain'
  },
  modalText: {
    marginBottom: 10,
  },
  watchAdButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: 'black',
    padding: 10,
    borderRadius: 5,
    fontWeight: 'bold',
    width: 200,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30, // Adjust spacing as needed
  },
  buttonText: {
    fontWeight: 'bold',
  },
});

export default HomescreenAdComponent;