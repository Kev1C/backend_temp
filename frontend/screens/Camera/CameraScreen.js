import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { IconButton, FAB, useTheme, Text, Button, MD3Colors } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { useNutritionStore, formatDate, fetchHeatmapData } from '../../stores/nutritionStore';
import FoodAnalysisBottomSheet from './FoodAnalysisBottomSheet';
import { useDiamondStore } from '../../stores/diamondStore';
import AdComponent from '../../Components/SettingScreenAdComponent';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const [showAdComponent, setShowAdComponent] = useState(false);

  const cameraRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const isFocused = useIsFocused();
  const { authToken } = useAuthStore();
  const updateDailyNutrition = useNutritionStore((state) => state.updateDailyNutrition);
  const fetchHeatmapData = useNutritionStore((state) => state.fetchHeatmapData);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const { balance, fetchBalance, addDiamonds, deductDiamonds } = useDiamondStore();

  const dynamicStyles = useMemo(() => ({
    confirmFab: {
      backgroundColor: theme.colors.primary,
    },
  }), [theme.colors.primary]);

  useEffect(() => {
    requestPermission();
    if (authToken) {
      fetchBalance(authToken);
    }
  }, [authToken]);

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

  const handleAdWatched = async (reward) => {
    // Assuming 1 rewarded video view = 5 diamonds
    const diamondsToAdd = 5;
    try {
      await addDiamonds(diamondsToAdd, authToken);
      Alert.alert('Success', `You've earned ${diamondsToAdd} diamonds!`);
      setShowAdComponent(false); // Hide the AdComponent after successfully adding diamonds
    } catch (error) {
      console.error('Error adding diamonds:', error);
      Alert.alert('Error', 'Failed to add diamonds. Please try again.');
    }
  };

const handleConfirm = async () => {
    if (!foodTitle) {
        Alert.alert('Error', 'Please enter a food name');
        return;
    }

    // The analysis cost is now handled on the backend
    const analysisCost = 5;

    if (balance < analysisCost) {
        // Show option to watch ad
        setShowAdComponent(true);
        Alert.alert('Insufficient Diamonds', 'You do not have enough diamonds to analyze. Please watch an ad to earn more.');
        return;
    }

    try {
        // Deduct diamonds - the backend handles the actual cost
        await deductDiamonds(analysisCost, authToken);

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

        // Refresh heatmap data
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        startDate.setUTCHours(0, 0, 0, 0);
        const endDate = new Date();
        endDate.setUTCHours(23, 59, 59, 999);
        await fetchHeatmapData(startDate.toISOString(), endDate.toISOString());

        setIsModalVisible(false);
        navigation.goBack();
    } catch (error) {
        console.error('Error saving nutrition data:', error.response?.data || error.message);
        if (error.response?.data?.message === 'Insufficient diamonds to perform analysis') {
            Alert.alert('Error', 'Insufficient diamonds to perform analysis');
        } else {
            Alert.alert('Error', 'Failed to save nutrition data');
        }
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
            <View style={[styles.topBar, { marginTop: insets.top }]}>
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
            <View style={[styles.buttonContainer, { paddingBottom: insets.bottom }]}>
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

        {/* Diamond Balance and Ad */}
        <View style={[styles.diamondBalanceContainer, { paddingTop: insets.top }]}>
          <View style={styles.diamondContainer}>
            <MaterialCommunityIcons
              name="diamond-stone"
              size={24}
              color="#00FFFF"
            />
            <Text style={styles.diamondText}>{balance}</Text>
          </View>
        </View>
        {showAdComponent && (
          <AdComponent onAdWatched={handleAdWatched} />
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
  diamondContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  diamondText: {
    marginLeft: 4,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    alignSelf: 'center',
  },
  diamondBalanceContainer: {
    position: 'absolute',
    top: 80,
    right: 10,
    padding: 10,
    borderRadius: 5,
  },
});

export default CameraScreen;