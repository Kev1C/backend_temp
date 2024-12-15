import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { Text, Button, IconButton, MD3Colors } from 'react-native-paper';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';

const CameraScreen = ({ navigation }) => {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const cameraRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const isFocused = useIsFocused();
  const { authToken } = useAuthStore();

  useEffect(() => {
    requestPermission();
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

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission}>Grant Permission</Button>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {isFocused && (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          onCameraReady={handleCameraReady}
        >
          <View style={styles.buttonContainer}>
            <IconButton
              icon="camera-flip"
              iconColor={MD3Colors.neutral100}
              size={30}
              onPress={toggleCameraFacing}
            />
            <IconButton
              icon="camera"
              iconColor={MD3Colors.neutral100}
              size={50}
              onPress={takePicture}
              disabled={!isCameraReady || isAnalyzing}
            />
          </View>
        </CameraView>
      )}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['50%']}
        enablePanDownToClose
      >
        <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
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
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  message: {
    fontSize: 18,
    marginBottom: 16,
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
  bottomSheetContent: {
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
