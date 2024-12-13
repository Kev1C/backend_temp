import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Text, Button, IconButton, MD3Colors } from 'react-native-paper';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const cameraRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { authToken } = useAuthStore();

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
    if (!cameraRef.current || !isCameraReady) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: true,
      });

      setCapturedImage({
        uri: photo.uri,
        base64: photo.base64,
        width: photo.width,
        height: photo.height,
      });

      bottomSheetRef.current?.snapToIndex(0);
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
      console.error(error);
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage || !authToken) return;

    setIsAnalyzing(true);
    try {
      const response = await api.post('/analyze/food', {
        image: capturedImage.base64,
        width: capturedImage.width,
        height: capturedImage.height,
      });

      if (response.data) {
        navigation.navigate('FoodAnalysis', { 
          analysis: response.data,
          imageUri: capturedImage.uri 
        });
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to analyze image. Please try again.'
      );
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCameraType = () => {
    setType(current => 
      current === Camera.Constants.Type.back 
        ? Camera.Constants.Type.front 
        : Camera.Constants.Type.back
    );
  };

  const toggleFlash = () => {
    setFlashMode(current =>
      current === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
  };

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>No access to camera</Text>
        <Button 
          mode="contained" 
          onPress={() => Camera.requestCameraPermissionsAsync()}
          style={styles.button}
        >
          Request Permission
        </Button>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {hasPermission && isFocused && (
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={type}
            flashMode={flashMode}
            onCameraReady={handleCameraReady}
          >
            <View style={styles.buttonContainer}>
              <View style={styles.buttonRow}>
                <IconButton
                  icon="camera-flip"
                  size={30}
                  iconColor={MD3Colors.neutral100}
                  onPress={toggleCameraType}
                />
                <IconButton
                  icon={flashMode === Camera.Constants.FlashMode.off ? 'flash-off' : 'flash'}
                  size={30}
                  iconColor={MD3Colors.neutral100}
                  onPress={toggleFlash}
                />
              </View>
              <View style={styles.captureButtonContainer}>
                <IconButton
                  icon="camera"
                  size={50}
                  iconColor={MD3Colors.neutral100}
                  onPress={takePicture}
                  disabled={!isCameraReady || isAnalyzing}
                />
              </View>
            </View>
          </Camera>
        )}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={['50%']}
          enablePanDownToClose
        >
          <BottomSheetScrollView contentContainerStyle={styles.bottomSheet}>
            {capturedImage && (
              <React.Fragment>
                <Text style={styles.previewText}>Preview</Text>
                <View style={styles.imagePreview}>
                  {/* Add Image preview component here */}
                </View>
                <Button
                  mode="contained"
                  onPress={analyzeImage}
                  loading={isAnalyzing}
                  disabled={isAnalyzing}
                  style={styles.analyzeButton}
                >
                  Analyze Food
                </Button>
              </React.Fragment>
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    margin: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  captureButtonContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  button: {
    marginTop: 16,
  },
  bottomSheet: {
    padding: 16,
  },
  previewText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
  },
  analyzeButton: {
    marginTop: 16,
  },
});

export default CameraScreen;
