import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Text, Button, IconButton, MD3Colors } from 'react-native-paper';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';

interface CapturedImage {
  uri: string;
  base64: string;
  width: number;
  height: number;
}

const CameraScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState<CameraType>(CameraType.back);
  const [flashMode, setFlashMode] = useState<FlashMode>(FlashMode.off);
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const cameraRef = useRef<Camera | null>(null);
  const bottomSheetRef = useRef<BottomSheet | null>(null);
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
    if (cameraRef.current && isCameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });
        setCapturedImage(photo as CapturedImage);
        bottomSheetRef.current?.expand();
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture.');
      }
    } else {
      Alert.alert('Error', 'Camera is not ready.');
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage?.base64) {
      Alert.alert('Error', 'No image captured.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await api.post('/food/analyze', {
        image: capturedImage.base64,
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data && response.data.results) {
        navigation.navigate('FoodAnalysis', {
          results: response.data.results,
          imageUri: capturedImage.uri,
        });
      } else {
        Alert.alert('Error', 'Could not analyze the image. Please try again.');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert(
        'Error',
        'Failed to analyze the image. Please check your internet connection and try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCameraType = () => {
    setType(current => 
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  const toggleFlash = () => {
    setFlashMode(current =>
      current === FlashMode.off ? FlashMode.on : FlashMode.off
    );
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }

  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {isFocused && (
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={type}
            flashMode={flashMode}
            onCameraReady={handleCameraReady}
          >
            <View style={styles.buttonContainer}>
              <IconButton
                icon="camera-flip"
                size={30}
                iconColor={MD3Colors.neutral100}
                onPress={toggleCameraType}
              />
              <IconButton
                icon="camera"
                size={50}
                iconColor={MD3Colors.neutral100}
                onPress={takePicture}
                disabled={!isCameraReady}
              />
              <IconButton
                icon={flashMode === FlashMode.off ? "flash-off" : "flash"}
                size={30}
                iconColor={MD3Colors.neutral100}
                onPress={toggleFlash}
              />
            </View>
          </Camera>
        )}

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={['50%']}
          enablePanDownToClose
        >
          <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
            {capturedImage && (
              <>
                <Text style={styles.bottomSheetTitle}>Image Captured!</Text>
                <Button
                  mode="contained"
                  onPress={analyzeImage}
                  loading={isAnalyzing}
                  disabled={isAnalyzing}
                  style={styles.analyzeButton}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Food'}
                </Button>
              </>
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
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 20,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  bottomSheetContent: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  analyzeButton: {
    width: '80%',
  },
});

export default CameraScreen;
