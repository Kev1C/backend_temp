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
      snapPoints={['60%']}
      onChange={handleSheetChanges}
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

                    <View style={styles.fabContainer}>
                      <FAB
                        icon="refresh"
                        label="Retake"
                        onPress={onRetake}
                        style={[styles.fab, styles.retakeFab]}
                        color="white"
                      />
                      <FAB
                        icon="check"
                        label="Confirm"
                        onPress={onConfirm}
                        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                        color="white"
                      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
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
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderColor: '#f0f0f0',
  },
  healthScoreChip: {
    marginHorizontal: 8,
    backgroundColor: '#fff',
  },
  fabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
  },
  fab: {
    borderRadius: 50,
    padding: 10,
    elevation: 5,
  },
  retakeFab: {
    backgroundColor: '#e0e0e0',
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