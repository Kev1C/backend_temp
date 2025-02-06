// frontend/Components/WelcomeMessageModal.js
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const modalWidth = screenWidth * 0.85;

const WelcomeMessageModal = ({ visible, onClose }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Modal visible={visible} transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Hooray! You're In!</Text>
          <Text style={styles.message}>Time to take control of your nutrition!</Text>
          <Text style={styles.message}>
            We've added <Text style={styles.highlight}>6500 shiny diamonds</Text> to your account to kick things off! 💎
          </Text>
          {!expanded ? (
            <Text onPress={() => setExpanded(true)} style={styles.readMore}>
              Read more
            </Text>
          ) : (
            <Text style={styles.message}>
              Diamonds unlock our Food Scanner: Use them to instantly analyze your meals with your camera and get detailed nutrition data. It's the fastest way to log your food!
              <Text onPress={() => setExpanded(false)} style={styles.readMore}>
                {' '}Read less
              </Text>
            </Text>
          )}
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: modalWidth,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginVertical: 5,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#FFA500',
  },
  readMore: {
    color: '#007bff',
    marginVertical: 5,
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
  },
});

export default WelcomeMessageModal;
