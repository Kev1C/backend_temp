import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { IconButton, FAB, useTheme, Text, Button, MD3Colors } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { useNutritionStore, formatDate } from '../../stores/nutritionStore';
import FoodAnalysisBottomSheet from './FoodAnalysisBottomSheet';

const CameraScreen = ({ navigation }) => {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [nutritionState, setNutritionState] = useState({
    calories: '',
    carbs: '',
    protein: '',
    fats: '',
    healthScore: '',
    baseCalories: '',
    baseCarbs: '',
    baseProtein: '',
    baseFats: '',
  });
  const [foodTitle, setFoodTitle] = useState('');
  const [servings, setServings] = useState(1);
  const [foodAnalysis, setFoodAnalysis] = useState({
    foodTitle: '',
    calories: '',
    carbs: '',
    protein: '',
    fats: '',
    healthScore: '',
  });
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const cameraRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const isFocused = useIsFocused();
  const { authToken } = useAuthStore();
  const updateDailyNutrition = useNutritionStore((state) => state.updateDailyNutrition);
  const theme = useTheme();

  const dynamicStyles = useMemo(() => ({
    confirmFab: {
      backgroundColor: theme.colors.primary,
    },
  }), [theme.colors.primary]);

  useEffect(() => {
    requestPermission();
  }, []);

  const handleCameraReady = () => {
    setIsCameraReady(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current || !isCameraReady) {
      console.log('Camera not ready:', { hasCamera: !!cameraRef.current, isCameraReady });
      return;
    }

    try {
      console.log('Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        exif: true,
        width: 1024,
        height: 1024
      });
      console.log('Picture taken successfully');
      console.log('Photo properties:', {
        hasUri: !!photo.uri,
        hasBase64: !!photo.base64,
        width: photo.width,
        height: photo.height,
        base64Length: photo.base64?.length
      });

      const image = {
        uri: photo.uri,
        base64: photo.base64,
        width: photo.width,
        height: photo.height,
      };

      setCapturedImage(image);
      setIsModalVisible(true);

      // Automatically trigger analysis after capturing
      await analyzeImage(image);

    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const analyzeImage = async (image) => {
    if (!image?.base64) {
      Alert.alert('Error', 'No image data available');
      return;
    }

    setAnalysisLoading(true);
    try {
      const response = await api.post('/food-analysis/analyze', { imageBase64: image.base64 });
      if (!response?.data) throw new Error('No analysis data received');

      const { calories, carbs, protein, fats, healthScore, foodTitle } = response.data;
      setFoodAnalysis(response.data);
      setNutritionState(prev => ({

        ...prev,
        calories, carbs, protein, fats, healthScore,
        baseCalories: calories,
        baseCarbs: carbs,
        baseProtein: protein,
        baseFats: fats,
      }));
      setFoodTitle(foodTitle || '');
    } catch (error) {
      Alert.alert('Analysis Failed', 'Please try again or enter details manually.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleRetake = () => {
    // Use bottomSheetRef.current.close() to properly close the sheet
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
    // The state will be reset in onCloseEnd of the BottomSheet
  };

  const getMealType = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Breakfast';
    if (hour >= 11 && hour < 15) return 'Lunch';
    return 'Dinner';
  };

  const handleConfirm = async () => {
    if (!foodTitle) {
      Alert.alert('Error', 'Please enter a food name');
      return;
    }

    try {
      const mealType = getMealType();
      const today = new Date();
      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const nutritionData = {
        name: foodTitle,
        image: capturedImage?.uri || '',
        time: currentTime,
        mealType,
        foodName: foodTitle,
        servings,
        calories: parseFloat(nutritionState.calories) || 0,
        carbs: parseFloat(nutritionState.carbs) || 0,
        protein: parseFloat(nutritionState.protein) || 0,
        fats: parseFloat(nutritionState.fats) || 0,
        healthScore: parseFloat(foodAnalysis.healthScore) || 0,
      };

      console.log('Sending nutrition data:', nutritionData);
      await updateDailyNutrition(today, nutritionData);
      setIsModalVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving nutrition data:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to save nutrition data');
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleSheetChanges = (index) => {
    if (index === -1) {
      setIsModalVisible(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No access to camera</Text>
        <Button onPress={requestPermission}>Request Permission</Button>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {isFocused && (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            onCameraReady={handleCameraReady}
          >
            {/* Top Bar */}
            <View style={styles.topBar}>
              <IconButton
                icon="arrow-left"
                size={30}
                iconColor={MD3Colors.neutral100}
                onPress={() => navigation.goBack()}
                style={styles.controlButton}
              />
              <Text style={styles.titleText}>Food Scanner</Text>
              <View style={{ width: 30 }} />
            </View>

            {/* Camera Frame Overlay */}
            <View style={styles.frameContainer}>
              <View style={styles.frame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>

            {/* Bottom Controls */}
            <View style={styles.buttonContainer}>
              <IconButton
                icon="camera-flip"
                iconColor={MD3Colors.neutral100}
                size={30}
                onPress={toggleCameraFacing}
                style={styles.controlButton}
              />
              <IconButton
                icon="camera"
                iconColor={MD3Colors.neutral100}
                size={50}
                onPress={takePicture}
                disabled={!isCameraReady || isAnalyzing}
                style={styles.controlButton}
              />
              <View style={{ width: 30 }} />
            </View>
          </CameraView>
        )}

        <FoodAnalysisBottomSheet
          bottomSheetRef={bottomSheetRef}
          capturedImage={capturedImage}
          setCapturedImage={setCapturedImage}
          isModalVisible={isModalVisible}
          handleSheetChanges={handleSheetChanges}
          foodAnalysis={foodAnalysis}
          analysisLoading={analysisLoading}
          nutritionState={nutritionState}
          setNutritionState={setNutritionState}
          foodTitle={foodTitle}
          setFoodTitle={setFoodTitle}
          servings={servings}
          setServings={setServings}
          onConfirm={handleConfirm}
          onRetake={handleRetake}
        />
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 20,
    fontSize: 16,
    color: '#333',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  frameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: Dimensions.get('window').width * 0.8,
    height: Dimensions.get('window').width * 0.8,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: 'white',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  topBar: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 10,
    zIndex: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CameraScreen;