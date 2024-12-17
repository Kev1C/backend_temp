import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Alert, Dimensions, Image, TextInput, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { Text, Button, IconButton, MD3Colors, FAB, Chip, useTheme } from 'react-native-paper';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { useNutritionStore } from '../../stores/nutritionStore';

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
  const { updateDailyNutrition } = useNutritionStore();
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
        quality: 0.8,
        base64: true,
        exif: true,
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

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleSheetChanges = (index) => {
    if (index === -1) {
      setIsModalVisible(false);
    }
  };

  const handleNutrientChange = (value, nutrientType) => {
    const numValue = parseFloat(value) || 0;
    setNutritionState(prev => ({

      ...prev,
      [nutrientType]: value,
      [`base${nutrientType.charAt(0).toUpperCase() + nutrientType.slice(1)}`]: 
        numValue > 0 ? (numValue / servings).toString() : prev[`base${nutrientType.charAt(0).toUpperCase() + nutrientType.slice(1)}`]
    }));
  };

  const incrementServings = () => {
    setServings(prev => {
      const newServings = prev + 1;
      updateNutritionValues(newServings);
      return newServings;
    });
  };

  const decrementServings = () => {
    setServings(prev => {
      if (prev <= 1) return prev;
      const newServings = prev - 1;
      updateNutritionValues(newServings);
      return newServings;
    });
  };

  const updateNutritionValues = (newServings) => {
    setNutritionState(prev => ({
      ...prev,
      calories: Math.round(parseFloat(prev.baseCalories) * newServings).toString(),
      carbs: Math.round(parseFloat(prev.baseCarbs) * newServings).toString(),
      protein: Math.round(parseFloat(prev.baseProtein) * newServings).toString(),
      fats: Math.round(parseFloat(prev.baseFats) * newServings).toString(),
    }));
  };

  const getHealthScoreColor = (score) => {
    const numScore = Math.min(Math.max(parseFloat(score) || 0, 0), 100);
    const red = numScore <= 50 ? 255 : Math.round(255 * (100 - numScore) / 50);
    const green = numScore >= 50 ? 255 : Math.round(255 * numScore / 50);
    return `rgb(${red}, ${green}, 0)`;
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

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const meal = {
      name: foodTitle,
      image: capturedImage?.base64 ? `data:image/jpeg;base64,${capturedImage.base64}` : null,
      calories: nutritionState.calories,
      carbs: nutritionState.carbs,
      protein: nutritionState.protein,
      fats: nutritionState.fats,
      time: currentTime
    };

    try {
      // Update nutrition store first
      await updateDailyNutrition(new Date(), {
        calories: Number(nutritionState.calories),
        carbs: Number(nutritionState.carbs),
        protein: Number(nutritionState.protein),
        fats: Number(nutritionState.fats)
      });

      // Navigate back with the meal data
      navigation.navigate('Home', {
        addMeal: meal,
        updateProgress: {
          calories: nutritionState.calories,
          carbs: nutritionState.carbs,
          protein: nutritionState.protein,
          fats: nutritionState.fats
        }
      });

      setIsModalVisible(false);
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    }
  };

  const handleRetake = () => {
    setIsModalVisible(false);
    setCapturedImage(null);
  };

  const renderBackdrop = (props) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
    />
  );

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
      <BottomSheet
        ref={bottomSheetRef}
        index={isModalVisible ? 0 : -1}
        snapPoints={['60%']}
        onChange={handleSheetChanges}
        enablePanDownToClose={true}
        enableContentPanningGesture={true}
        enableHandlePanningGesture={true}
        handleIndicatorStyle={styles.modalHandle}
        handleStyle={styles.handleStyle}
        backgroundStyle={styles.modalContent}
        renderBackdrop={renderBackdrop}
      >
        <View style={styles.bottomSheetContent}>
          <BottomSheetScrollView 
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.scrollContent}>
              {capturedImage && (
                <>
                  <View style={styles.headerContainer}>
                    <Image 
                      source={{ uri: capturedImage.uri }} 
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <Chip 
                      mode="outlined" 
                      style={[styles.mealTypeChip, { borderRadius: 25 }]}
                      textStyle={{ fontSize: 14 }}
                    >
                      {getMealType()}
                    </Chip>
                    {foodAnalysis.healthScore && (
                      <Chip 
                        mode="outlined" 
                        style={[
                          styles.healthScoreChip, 
                          { 
                            borderRadius: 25,
                            borderColor: getHealthScoreColor(foodAnalysis.healthScore),
                          }
                        ]}
                        textStyle={{ 
                          fontSize: 14,
                          color: getHealthScoreColor(foodAnalysis.healthScore)
                        }}
                      >
                        Health Score: {foodAnalysis.healthScore}
                      </Chip>
                    )}
                  </View>

                  <View style={styles.foodInputContainer}>
                    <TextInput
                      style={styles.foodTitleInput}
                      placeholder="Enter food name"
                      value={foodTitle}
                      onChangeText={setFoodTitle}
                    />
                    <View style={styles.servingsContainer}>
                      <IconButton
                        icon="minus"
                        size={20}
                        onPress={decrementServings}
                        disabled={servings <= 1}
                      />
                      <Text style={styles.servingsText}>{servings}</Text>
                      <IconButton
                        icon="plus"
                        size={20}
                        onPress={incrementServings}
                      />
                    </View>
                  </View>

                  <View style={styles.cardsContainer}>
                    {/* First Row */}
                    <View style={styles.cardRow}>
                      <View style={styles.card}>
                        <Text style={styles.cardLabel}>Calories</Text>
                        <TextInput
                          style={styles.cardInput}
                          value={nutritionState.calories}
                          onChangeText={(value) => handleNutrientChange(value, 'calories')}
                          keyboardType="numeric"
                          placeholder="0"
                        />
                      </View>
                      <View style={styles.card}>
                        <Text style={styles.cardLabel}>Carbs</Text>
                        <TextInput
                          style={styles.cardInput}
                          value={nutritionState.carbs}
                          onChangeText={(value) => handleNutrientChange(value, 'carbs')}
                          keyboardType="numeric"
                          placeholder="0g"
                        />
                      </View>
                    </View>

                    {/* Second Row */}
                    <View style={styles.cardRow}>
                      <View style={styles.card}>
                        <Text style={styles.cardLabel}>Protein</Text>
                        <TextInput
                          style={styles.cardInput}
                          value={nutritionState.protein}
                          onChangeText={(value) => handleNutrientChange(value, 'protein')}
                          keyboardType="numeric"
                          placeholder="0g"
                        />
                      </View>
                      <View style={styles.card}>
                        <Text style={styles.cardLabel}>Fats</Text>
                        <TextInput
                          style={styles.cardInput}
                          value={nutritionState.fats}
                          onChangeText={(value) => handleNutrientChange(value, 'fats')}
                          keyboardType="numeric"
                          placeholder="0g"
                        />
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          </BottomSheetScrollView>
          <View style={styles.fabContainer}>
            <FAB
              icon="refresh"
              label="Retake"
              onPress={handleRetake}
              style={[styles.fab, styles.retakeFab]}
              color="white"
            />
            <FAB
              icon="check"
              label="Confirm"
              onPress={handleConfirm}
              style={[styles.fab, dynamicStyles.confirmFab]}
              color="white"
            />
          </View>
        </View>
      </BottomSheet>
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
  bottomSheetContent: {
    flex: 1,
    paddingBottom: 80,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 90,
  },
  scrollContent: {
    padding: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  foodInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  foodTitleInput: {
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
    flex: 1,
    marginRight: 15,
    color: '#333',
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    paddingHorizontal: 8,
  },
  servingsText: {
    fontSize: 16,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  cardsContainer: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    width: '45%',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  cardInput: {
    fontSize: 16,
    paddingVertical: 5,
    textAlign: 'center',
    fontWeight: '500',
    color: '#333',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  analyzeButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleStyle: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  modalHandle: {
    backgroundColor: '#e0e0e0',
    width: 40,
    height: 4,
    borderRadius: 2,
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
  mealTypeChip: {
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderColor: '#f0f0f0',
  },
  healthScoreChip: {
    marginHorizontal: 8,
    backgroundColor: '#fff',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  fab: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 10,
    elevation: 5,
  },
  retakeFab: {
    backgroundColor: '#e0e0e0',
  }
});

export default CameraScreen;
