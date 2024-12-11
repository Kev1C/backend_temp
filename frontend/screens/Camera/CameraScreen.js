import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Text, Button, IconButton, MD3Colors } from 'react-native-paper';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { authToken } = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleCameraReady = () => {
    setIsCameraReady(true);
  };

  const takePicture = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });
        setCapturedImage(photo.base64);
        bottomSheetRef.current?.expand();
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture.');
      }
    } else {
      Alert.alert('Error', 'Camera is not ready.');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    bottomSheetRef.current?.close();
  };

  const handleUsePhoto = async () => {
    if (!authToken) {
      Alert.alert('Authentication Error', 'Please log in to use this feature.');
      return;
    }

    try {
      const response = await api.post('/api/food-recognition', {
        image: capturedImage,
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data && response.data.foodItems) {
        navigation.navigate('FoodSelectScreen', { foodItems: response.data.foodItems });
      } else {
        Alert.alert('Error', 'Failed to recognize food items.');
      }
    } catch (error) {
      console.error('Error sending image to server:', error);
      Alert.alert('Error', 'Failed to process image.');
    } finally {
      bottomSheetRef.current?.close();
    }
  };

  const toggleCameraType = () => {
    setType(
      type === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  const toggleFlashMode = () => {
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
  };

  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <Camera
          style={styles.camera}
          type={type}
          flashMode={flashMode}
          ref={cameraRef}
          onCameraReady={handleCameraReady}
        >
          <View style={styles.topButtons}>
            <IconButton
              icon="camera-switch"
              iconColor={MD3Colors.neutral100}
              size={30}
              onPress={toggleCameraType}
            />
            <IconButton
              icon={flashMode === Camera.Constants.FlashMode.off ? 'flash-off' : 'flash'}
              iconColor={MD3Colors.neutral100}
              size={30}
              onPress={toggleFlashMode}
            />
          </View>
        </Camera>
      )}

      <View style={styles.bottomContainer}>
        <View style={styles.buttonContainer}>
          <Button icon="camera" mode="contained" onPress={takePicture} style={styles.captureButton}>
            Take Picture
          </Button>
        </View>
      </View>

      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={['50%']}
          enablePanDownToClose={true}
        >
          <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
            {capturedImage && (
              <>
                <Text style={styles.bottomSheetText}>Use this photo?</Text>
                <View style={styles.bottomSheetButtons}>
                  <Button mode="outlined" onPress={handleRetake} style={styles.bottomSheetButton}>
                    Retake
                  </Button>
                  <Button mode="contained" onPress={handleUsePhoto} style={styles.bottomSheetButton}>
                    Use Photo
                  </Button>
                </View>
              </>
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      </GestureHandlerRootView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  topButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  captureButton: {
    width: '50%',
  },
  bottomSheetContent: {
    backgroundColor: 'white',
    padding: 16,
    height: '100%',
  },
  bottomSheetText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  bottomSheetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bottomSheetButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default CameraScreen;
