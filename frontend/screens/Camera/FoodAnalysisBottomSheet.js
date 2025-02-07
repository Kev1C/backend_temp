import React from 'react';
import { View, StyleSheet, Dimensions, Image, TextInput, ActivityIndicator } from 'react-native';
import { Text, Button, IconButton, MD3Colors, Chip, useTheme, FAB } from 'react-native-paper';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useNutritionStore, formatDate } from '../../stores/nutritionStore';
import { api } from '../../services/api';

const FoodAnalysisBottomSheet = ({
  bottomSheetRef,
  capturedImage,
  setCapturedImage,
  isModalVisible,
  handleSheetChanges,
  foodAnalysis,
  analysisLoading,
  nutritionState,
  setNutritionState,
  foodTitle,
  setFoodTitle,
  servings,
  setServings,
  onConfirm,
  onRetake,
}) => {
  const theme = useTheme();

  const [currentSnapPoint, setCurrentSnapPoint] = React.useState(0);

  const snapPoints = React.useMemo(() => ['60%', '80%'], []);

  const imageSize = React.useMemo(() => 
    currentSnapPoint === 0 ? 
      { width: 100, height: 100 } : 
      { width: Dimensions.get('window').width * 0.8, height: 200 }
  , [currentSnapPoint]);

  const headerLayout = React.useMemo(() => 
    currentSnapPoint === 0 ? 
      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } : 
      { flexDirection: 'column', alignItems: 'center' }
  , [currentSnapPoint]);

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
    const newServings = servings + 1;
    updateNutritionValues(newServings);
    setServings(newServings);
  };

  const decrementServings = () => {
    if (servings <= 1) return;
    const newServings = servings - 1;
    updateNutritionValues(newServings);
    setServings(newServings);
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
    if (numScore < 40) {
      return '#FF4D4D'; // bright red for low scores
    } else if (numScore < 70) {
      return '#FFA500'; // orange for medium scores
    } else {
      return '#2ECC71'; // bright green for high scores
    }
  };

  const getMealType = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Breakfast';
    if (hour >= 11 && hour < 15) return 'Lunch';
    return 'Dinner';
  };

  const handleSheetChange = React.useCallback((index) => {
    setCurrentSnapPoint(index);
    handleSheetChanges(index);
  }, [handleSheetChanges]);

  const renderBackdrop = (props) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
    />
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isModalVisible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose={true}
      enableContentPanningGesture={true}
      enableHandlePanningGesture={true}
      handleIndicatorStyle={styles.modalHandle}
      handleStyle={styles.handleStyle}
      backgroundStyle={styles.modalContent}
      renderBackdrop={renderBackdrop}
      onCloseEnd={() => {
        // Reset the state after the bottom sheet is fully closed
        setCapturedImage(null);
      }}
    >
      <View style={styles.bottomSheetContent}>
        <BottomSheetScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scrollContent}>
            {capturedImage && (
              <>
                {analysisLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Analyzing your food...</Text>
                  </View>
                ) : (
                  <>
                    <View style={[styles.headerContainer, headerLayout]}>
                      <View style={[styles.imageContainer, currentSnapPoint === 0 && styles.imageContainerSmall]}>
                        <Image
                          source={{ uri: capturedImage.uri }}
                          style={[styles.imagePreview, imageSize]}
                          resizeMode="cover"
                        />
                      </View>
                      <View style={[styles.chipsContainer, currentSnapPoint === 0 && styles.chipsContainerSmall]}>
                        <Chip
                          mode="outlined"
                          style={[styles.chip, styles.mealTypeChip]}
                          textStyle={{ fontSize: 14 }}
                        >
                          {getMealType()}
                        </Chip>
                        {foodAnalysis.healthScore && (
                          <Chip
                            mode="outlined"
                            style={[
                              styles.chip,
                              styles.healthScoreChip,
                              {
                                backgroundColor: 'white',
                                elevation: 2,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.2,
                                shadowRadius: 2,
                                borderColor: getHealthScoreColor(foodAnalysis.healthScore),
                                borderWidth: 1.5,
                              }
                            ]}
                            textStyle={{
                              fontSize: 16,
                              fontWeight: '900',
                              color: getHealthScoreColor(foodAnalysis.healthScore)
                            }}
                          >
                            Health Score: {foodAnalysis.healthScore}
                          </Chip>
                        )}
                      </View>
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

                    <View style={styles.fabContainer}>
                      <Button
                        icon="refresh"
                        mode="contained-tonal"
                        onPress={onRetake}
                        style={styles.retakeButton}
                        labelStyle={styles.buttonLabel}
                      >
                        Retake
                      </Button>
                      <Button
                        icon="check"
                        mode="contained"
                        onPress={onConfirm}
                        style={styles.confirmButton}
                        labelStyle={styles.buttonLabel}
                      >
                        Confirm
                      </Button>
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        </BottomSheetScrollView>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
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
    width: '100%',
    marginBottom: 12,
    padding: 8,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  imageContainerSmall: {
    marginBottom: 0,
    marginRight: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipsContainerSmall: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chip: {
    borderRadius: 25,
    marginVertical: 4,
  },
  imagePreview: {
    borderRadius: 10,
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
  mealTypeChip: {
    backgroundColor: '#fff',
    borderColor: '#f0f0f0',
  },
  healthScoreChip: {
    backgroundColor: '#fff',
  },
  fabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
  },
  retakeButton: {
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    flex: 1,
    marginLeft: 10,
  },
  buttonLabel: {
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  },
});

export default FoodAnalysisBottomSheet;