import React, { useState, useRef, useCallback, useMemo, useEffect, lazy, Suspense } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Dimensions, Image, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useTheme, IconButton, FAB, Chip } from 'react-native-paper';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

const CameraScreen = ({ navigation }) => {
  // Essential states initialized immediately
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef(null);
  const isFocused = useIsFocused();
  const theme = useTheme();
  const navigation = useNavigation();

  // Defer non-essential state initialization
  const [flashMode, setFlashMode] = useState(() => 'off');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [capturedImage, setCapturedImage] = useState(() => null);
  const [foodTitle, setFoodTitle] = useState(() => '');
  const [servings, setServings] = useState(() => 1);
  const [nutritionState, setNutritionState] = useState(() => ({
    calories: '',
    carbs: '',
    protein: '',
    fats: '',
    healthScore: '',
    baseCalories: '',
    baseCarbs: '',
    baseProtein: '',
    baseFats: '',
  }));

  // Create theme-dependent styles
  const dynamicStyles = useMemo(() => ({
    confirmFab: {
      backgroundColor: theme.colors.primary,
    },
  }), [theme.colors.primary]);

  // Calculate health score color
  const getHealthScoreColor = useCallback((score) => {
    // Convert score to number and clamp between 0-100
    const numScore = Math.min(Math.max(parseFloat(score) || 0, 0), 100);

    // Calculate RGB values
    const red = numScore <= 50 ? 255 : Math.round(255 * (100 - numScore) / 50);
    const green = numScore >= 50 ? 255 : Math.round(255 * numScore / 50);

    return `rgb(${red}, ${green}, 0)`;
  }, []);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (capturedImage) {
        // Clean up the captured image URI when component unmounts
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, [capturedImage]);

  // Memoize permission check result
  const permissionCheck = useMemo(() => {
    if (!permission || !isFocused) {
      return { show: false };
    }
    if (!permission.granted) {
      return {
        show: true,
        needsPermission: true
      };
    }
    return { show: true, needsPermission: false };
  }, [permission, isFocused]);

  // Memoized callback functions
  const toggleFlash = useCallback(() => {
    setFlashMode(current => current === 'off' ? 'torch' : 'off');
  }, []);

  const handleRetake = useCallback(() => {
    setIsModalVisible(false);
    setCapturedImage(null);
  }, []);

  const getMealType = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Breakfast';
    if (hour >= 11 && hour < 15) return 'Lunch';
    return 'Dinner';
  }, []);

  const updateNutritionValues = useCallback((newServings) => {
    setNutritionState(prev => ({
      ...prev,
      calories: Math.round(parseFloat(prev.baseCalories) * newServings).toString(),
      carbs: Math.round(parseFloat(prev.baseCarbs) * newServings).toString(),
      protein: Math.round(parseFloat(prev.baseProtein) * newServings).toString(),
      fats: Math.round(parseFloat(prev.baseFats) * newServings).toString(),
    }));
  }, []);

  const incrementServings = useCallback(() => {
    setServings(prev => {
      const newServings = prev + 1;
      updateNutritionValues(newServings);
      return newServings;
    });
  }, [updateNutritionValues]);

  const decrementServings = useCallback(() => {
    setServings(prev => {
      if (prev <= 1) return prev;
      const newServings = prev - 1;
      updateNutritionValues(newServings);
      return newServings;
    });
  }, [updateNutritionValues]);

  const handleNutrientChange = useCallback((value, nutrientType) => {
    const numValue = parseFloat(value) || 0;
    setNutritionState(prev => ({
      ...prev,
      [nutrientType]: value,
      [`base${nutrientType.charAt(0).toUpperCase() + nutrientType.slice(1)}`]: 
        numValue > 0 ? (numValue / servings).toString() : prev[`base${nutrientType.charAt(0).toUpperCase() + nutrientType.slice(1)}`]
    }));
  }, [servings]);

  const { authToken, user } = useContext(AuthContext);

  const takePicture = useCallback(async () => {
    if (!authToken || !user) {
      Alert.alert(
        'Authentication Required',
        'Please sign in to use the food scanner.',
        [{ text: 'OK', onPress: () => navigation.navigate('Profile') }]
      );
      return;
    }

    try {
      const photo = await camera.current?.takePictureAsync({
        quality: 0.5,
        base64: true,
        exif: false,
        skipProcessing: true,
      });

      if (!photo) return;

      setCapturedImage(photo.uri);
      setIsModalVisible(true);

      const imageData = {
        imageBase64: photo.base64,
        timestamp: Date.now(),
        userId: user.id
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await api.post('/food-analysis/analyze-food', imageData, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Axios response data is already parsed JSON
        const nutritionData = response.data;

        setFoodTitle(nutritionData.foodTitle || '');
        setNutritionState({
          calories: nutritionData.calories,
          carbs: nutritionData.carbs,
          protein: nutritionData.protein,
          fats: nutritionData.fats,
          healthScore: nutritionData.healthScore,
          baseCalories: nutritionData.calories,
          baseCarbs: nutritionData.carbs,
          baseProtein: nutritionData.protein,
          baseFats: nutritionData.fats,
        });
      } catch (error) {
        console.error('Error analyzing food:', error);
        if (error.response?.status === 401) {
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please sign in again.',
            [{ text: 'OK', onPress: () => navigation.navigate('Profile') }]
          );
        } else {
          Alert.alert(
            'Error',
            'Failed to analyze food. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert(
        'Error',
        'Failed to take picture. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [navigation, authToken, user]);

  const handleConfirm = useCallback(async () => {
    const meal = {
      name: foodTitle,
      image: capturedImage,
      calories: parseInt(nutritionState.calories),
      carbs: parseInt(nutritionState.carbs),
      protein: parseInt(nutritionState.protein),
      fats: parseInt(nutritionState.fats),
      time: getMealType(),
    };

    // Check if user is a guest
    if (user?.isGuest) {
      // Handle guest user data (e.g., save to local storage)
      navigation.navigate('Home', { 
        addMeal: meal,
        updateProgress: {
          calories: parseInt(nutritionState.calories),
          carbs: parseInt(nutritionState.carbs),
          protein: parseInt(nutritionState.protein),
          fats: parseInt(nutritionState.fats),
        }
      });
    } else {
      // Handle authenticated user data (send to backend)
      try {
        const response = await api.post('/meals', meal, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.status === 201) {
          navigation.navigate('Home', { 
            addMeal: meal,
            updateProgress: {
              calories: parseInt(nutritionState.calories),
              carbs: parseInt(nutritionState.carbs),
              protein: parseInt(nutritionState.protein),
              fats: parseInt(nutritionState.fats),
            }
          });
        } else {
          Alert.alert('Error', 'Failed to save meal. Please try again.');
        }
      } catch (error) {
        console.error('Error saving meal:', error);
        Alert.alert('Error', 'Failed to save meal. Please try again.');
      }
    }

    setIsModalVisible(false);
  }, [foodTitle, capturedImage, nutritionState, getMealType, navigation, user, authToken]);

  const snapPoints = useMemo(() =>  ['60%']);
  const bottomSheetRef = useRef(null);

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleSheetChanges = useCallback((index) => {
    setIsModalVisible(index !== -1);
  }, []);

  if (!permissionCheck.show) {
    return <View />;
  }

  if (permissionCheck.needsPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <CameraView 
          style={styles.camera} 
          facing={facing}
          ref={camera}
          enableTorch={flashMode === 'torch'}
          playSoundOnCapture={false}
          playSoundOnRecord={false}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <IconButton
              icon="arrow-left"
              size={30}
              iconColor="white"
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
          <View style={styles.controlsContainer}>
            <IconButton
              icon={flashMode === 'off' ? "flash-off" : "flash"}
              size={30}
              iconColor="white"
              onPress={toggleFlash}
              style={styles.controlButton}
            />
            <TouchableOpacity
              onPress={takePicture}
              style={styles.captureButton}
            />
            <View style={styles.placeholderButton} />
          </View>
        </CameraView>

        <BottomSheet
          ref={bottomSheetRef}
          index={isModalVisible ? 0 : -1}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          enablePanDownToClose={false}
          enableContentPanningGesture={true}
          enableHandlePanningGesture={true}
          handleIndicatorStyle={styles.modalHandle}
          handleStyle={styles.handleStyle}
          backgroundStyle={styles.modalContent}
          backdropComponent={renderBackdrop}
        >
          <View style={styles.bottomSheetContent}>
            <BottomSheetScrollView 
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.scrollContent}>
                <View style={styles.headerContainer}>
                  {capturedImage && (
                    <Image 
                      source={{ uri: capturedImage }} 
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  )}
                  <Chip 
                    mode="outlined" 
                    style={[styles.mealTypeChip, { borderRadius: 25 }]}
                    textStyle={{ fontSize: 14 }}
                  >
                    {getMealType()}
                  </Chip>
                  {nutritionState.healthScore && (
                    <Chip 
                      mode="outlined" 
                      style={[
                        styles.healthScoreChip, 
                        { 
                          borderRadius: 25,
                          borderColor: getHealthScoreColor(nutritionState.healthScore),
                        }
                      ]}
                      textStyle={{ 
                        fontSize: 14,
                        color: getHealthScoreColor(nutritionState.healthScore)
                      }}
                    >
                      Health Score: {nutritionState.healthScore}
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
  permissionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 50,
  },
  permissionButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
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
  controlsContainer: {
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
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    borderWidth: 5,
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  placeholderButton: {
    width: 30,
    height: 30,
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
  scrollContent: {
    padding: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTypeChip: {
    marginRight: 10,
    backgroundColor: '#f5f5f5',
  },
  healthScoreChip: {
    marginLeft: 10,
    backgroundColor: 'transparent',
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
  bottomSheetContent: {
    flex: 1,
    paddingBottom: 80,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 90,
  },
  fabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
  },
  fab: {
    borderRadius: 28,
  },
  retakeFab: {
    backgroundColor: '#666',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
  },
});

export default CameraScreen;