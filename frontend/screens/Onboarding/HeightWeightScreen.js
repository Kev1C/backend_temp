import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScrollPicker from 'react-native-wheel-scrollview-picker';
import Button from '../../Components/Button';
import OnboardingProgress from '../../Components/OnboardingProgress';
import { api } from '../../services/api';
import { useOnboardingStore } from '../../stores/onboardingStore';

const HeightWeightScreen = ({ navigation, route }) => {
  const { saveOnboardingData } = useOnboardingStore();
  const [isMetric, setIsMetric] = useState(true);
  const [heightCm, setHeightCm] = useState(175);
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(9);
  const [weight, setWeight] = useState(70);  // Default to 70kg for metric

  useEffect(() => {
    if (isMetric) {
      // Convert ft/in to cm when switching to metric
      const totalInches = (heightFt * 12) + heightIn;
      setHeightCm(Math.round(totalInches * 2.54));
      // Only convert weight if it's not the initial state
      if (weight !== 70) {
        setWeight(Math.round(weight / 2.205)); // Convert lbs to kg
      }
    } else {
      // Convert cm to ft/in when switching to imperial
      const totalInches = heightCm / 2.54;
      setHeightFt(Math.floor(totalInches / 12));
      setHeightIn(Math.round(totalInches % 12));
      setWeight(Math.round(weight * 2.205)); // Convert kg to lbs
    }
  }, [isMetric]);

  const heightRange = isMetric 
    ? { min: 140, max: 220 }
    : { min: 4, max: 7 };

  const inchesRange = { min: 0, max: 11 };

  const weightRange = isMetric
    ? { min: 40, max: 150 }
    : { min: 88, max: 330 };

  const handleHeightChange = (value) => {
    setHeightCm(value);
  };

  const handleHeightFtChange = (value) => {
    setHeightFt(value);
    // Update cm value
    const totalInches = (value * 12) + heightIn;
    setHeightCm(Math.round(totalInches * 2.54));
  };

  const handleHeightInChange = (value) => {
    setHeightIn(value);
    // Update cm value
    const totalInches = (heightFt * 12) + value;
    setHeightCm(Math.round(totalInches * 2.54));
  };

  const handleWeightChange = (value) => {
    setWeight(value);
  };

  const handleContinue = async () => {
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
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <OnboardingProgress currentScreen="HeightWeight" />
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
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

      <View style={styles.buttonContainer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          style={{ backgroundColor: '#2196F3' }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
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
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});

export default HeightWeightScreen;
