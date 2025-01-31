import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScrollPicker from 'react-native-wheel-scrollview-picker';
import Button from '../../Components/Button';
import OnboardingProgress from '../../Components/OnboardingProgress';
import sharedStyles from './SharedOnboardingLayout.styles';
import { api } from '../../services/api';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { debounce } from 'lodash';

// Unit conversion utilities
const convertToMetric = {
  height: (ft, inches) => Math.round((ft * 12 + inches) * 2.54),
  weight: (lbs) => Math.round(lbs / 2.205),
};

const convertToImperial = {
  height: (cm) => {
    const totalInches = cm / 2.54;
    return {
      ft: Math.floor(totalInches / 12),
      inches: Math.round(totalInches % 12),
    };
  },
  weight: (kg) => Math.round(kg * 2.205),
};

const HeightWeightScreen = ({ navigation, route }) => {
  const { saveOnboardingData } = useOnboardingStore();
  const [isMetric, setIsMetric] = useState(true);
  const [measurements, setMeasurements] = useState({
    heightCm: 175,
    heightFt: 5,
    heightIn: 9,
    weight: 70,
  });

  const { heightCm, heightFt, heightIn, weight } = measurements;
  const insets = useSafeAreaInsets();

  // Memoize ranges to prevent recalculation
  const ranges = useMemo(() => ({
    height: isMetric ? { min: 140, max: 220 } : { min: 4, max: 7 },
    inches: { min: 0, max: 11 },
    weight: isMetric ? { min: 40, max: 150 } : { min: 88, max: 330 },
  }), [isMetric]);

  // Debounced update functions
  const debouncedSetMeasurements = useCallback(
    debounce((updates) => {
      setMeasurements(prev => ({ ...prev, ...updates }));
    }, 100),
    []
  );

  useEffect(() => {
    if (isMetric) {
      const newHeightCm = convertToMetric.height(heightFt, heightIn);
      const newWeight = weight === 70 ? weight : convertToMetric.weight(weight);
      debouncedSetMeasurements({
        heightCm: newHeightCm,
        weight: newWeight,
      });
    } else {
      const { ft, inches } = convertToImperial.height(heightCm);
      debouncedSetMeasurements({
        heightFt: ft,
        heightIn: inches,
        weight: convertToImperial.weight(weight),
      });
    }
  }, [isMetric]);

  const handleHeightChange = useCallback((value) => {
    debouncedSetMeasurements({ heightCm: value });
  }, []);

  const handleHeightFtChange = useCallback((value) => {
    const newHeightCm = convertToMetric.height(value, heightIn);
    debouncedSetMeasurements({
      heightFt: value,
      heightCm: newHeightCm,
    });
  }, [heightIn]);

  const handleHeightInChange = useCallback((value) => {
    const newHeightCm = convertToMetric.height(heightFt, value);
    debouncedSetMeasurements({
      heightIn: value,
      heightCm: newHeightCm,
    });
  }, [heightFt]);

  const handleWeightChange = useCallback((value) => {
    debouncedSetMeasurements({ weight: value });
  }, []);

  const handleContinue = useCallback(async () => {
    try {
      const measurements = {
        height: Number(heightCm),
        weight: Number(weight),
      };
      await saveOnboardingData(measurements);
      navigation.navigate('ActivityLevel');
    } catch (error) {
      console.error('Error saving measurements:', error);
      Alert.alert('Error', 'Failed to save your measurements. Please try again.', [
        { text: 'OK' },
      ]);
    }
  }, [heightCm, weight, saveOnboardingData, navigation]);

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <OnboardingProgress currentScreen="HeightWeight" />
      <View style={sharedStyles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={sharedStyles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={sharedStyles.content}>
        <Text style={styles.title}>Your Measurements</Text>
        <Text style={styles.subtitle}>Help us personalize your experience</Text>

        <View style={styles.unitToggleContainer}>
          <TouchableOpacity
            style={[styles.unitButton, isMetric && styles.unitButtonActive]}
            onPress={() => setIsMetric(true)}
          >
            <Text style={[styles.unitButtonText, isMetric && styles.unitButtonTextActive]}>Metric</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, !isMetric && styles.unitButtonActive]}
            onPress={() => setIsMetric(false)}
          >
            <Text style={[styles.unitButtonText, !isMetric && styles.unitButtonTextActive]}>Imperial</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pickerContainer}>
          <View style={styles.pickerRow}>
            <View style={styles.pickerColumn}>
              <Text style={styles.label}>Height</Text>
              {isMetric ? (
                <View style={styles.picker}>
                  <ScrollPicker
                    dataSource={Array.from({ length: 81 }, (_, i) => (140 + i).toString())}
                    selectedIndex={heightCm - 140}
                    renderItem={(data) => (
                      <Text style={styles.pickerText}>{data} cm</Text>
                    )}
                    onValueChange={(data) => handleHeightChange(parseInt(data))}
                    wrapperHeight={150}
                    wrapperBackground="#FFFFFF"
                    itemHeight={40}
                    highlightColor="#f5f5f5"
                  />
                </View>
              ) : (
                <View style={styles.imperialPickerContainer}>
                  <View style={styles.picker}>
                    <ScrollPicker
                      dataSource={Array.from({ length: 4 }, (_, i) => (4 + i).toString())}
                      selectedIndex={heightFt - 4}
                      renderItem={(data) => (
                        <Text style={styles.pickerText}>{data} ft</Text>
                      )}
                      onValueChange={(data) => handleHeightFtChange(parseInt(data))}
                      wrapperHeight={150}
                      wrapperBackground="#FFFFFF"
                      itemHeight={40}
                      highlightColor="#f5f5f5"
                    />
                  </View>
                  <View style={styles.picker}>
                    <ScrollPicker
                      dataSource={Array.from({ length: 12 }, (_, i) => i.toString())}
                      selectedIndex={heightIn}
                      renderItem={(data) => (
                        <Text style={styles.pickerText}>{data} in</Text>
                      )}
                      onValueChange={(data) => handleHeightInChange(parseInt(data))}
                      wrapperHeight={150}
                      wrapperBackground="#FFFFFF"
                      itemHeight={40}
                      highlightColor="#f5f5f5"
                    />
                  </View>
                </View>
              )}
            </View>

            <View style={styles.pickerColumn}>
              <Text style={styles.label}>Weight</Text>
              <View style={styles.picker}>
                <ScrollPicker
                  dataSource={
                    isMetric
                      ? Array.from({ length: 111 }, (_, i) => (40 + i).toString())
                      : Array.from({ length: 243 }, (_, i) => (88 + i).toString())
                  }
                  selectedIndex={isMetric ? weight - 40 : weight - 88}
                  renderItem={(data) => (
                    <Text style={styles.pickerText}>{data} {isMetric ? 'kg' : 'lbs'}</Text>
                  )}
                  onValueChange={(data) => handleWeightChange(parseInt(data))}
                  wrapperHeight={150}
                  wrapperBackground="#FFFFFF"
                  itemHeight={40}
                  highlightColor="#f5f5f5"
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={[sharedStyles.footer, { paddingBottom: insets.bottom }]}>
        <Button
          title="Continue"
          onPress={handleContinue}
          style={{ backgroundColor: '#2196F3' }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  unitToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  unitButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unitButtonText: {
    fontSize: 16,
    color: '#666',
  },
  unitButtonTextActive: {
    color: '#333',
    fontWeight: '600',
  },
  pickerContainer: {
    marginTop: 20,
    flex: 1,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  pickerColumn: {
    alignItems: 'center',
  },
  imperialPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  picker: {
    width: 100,
    height: 150,
    marginHorizontal: 5,
  },
  pickerText: {
    fontSize: 20,
    color: '#000000',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000000',
  },
});

export default HeightWeightScreen;