//frontend/Components/ProgressInput.js
import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  Text, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { api } from '../services/api';
import { useTheme } from 'react-native-paper';
import { useAuthStore } from '../stores/authStore';
import { calculateLeanBodyMass, calculateBodyFat, calculateMuscleMass } from '../utils/bodyComposition';

const ProgressInput = React.memo(({ token, onSubmit, disabled }) => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    weight: '',
    muscleMass: '',
    fatPercentage: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simplified validation function
  const validateField = useCallback((value) => {
    if (!value) return true; // Allow empty fields during typing
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 && num < 1000;
  }, []);

  const handleChange = useCallback((name, value) => {
    // Only allow numbers and decimal point
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    if ((sanitizedValue.match(/\./g) || []).length > 1) {
      return;
    }

    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: sanitizedValue
      };

      // Auto-calculate muscle mass and body fat when weight changes and the value is not empty
      if (name === 'weight') {
        if (sanitizedValue && parseFloat(sanitizedValue) > 0 && user?.height && user?.gender) {
          const weight = parseFloat(sanitizedValue);
          const leanBodyMass = calculateLeanBodyMass(weight, user.height, user.gender);
          
          if (leanBodyMass !== null) {
            const bodyFat = calculateBodyFat(weight, leanBodyMass);
            const muscleMass = calculateMuscleMass(leanBodyMass);

            if (bodyFat !== null) {
              newData.fatPercentage = bodyFat.toString();
            }
            if (muscleMass !== null) {
              newData.muscleMass = muscleMass.toString();
            }
          }
        } else {
          // Clear the calculated fields if weight is empty or invalid
          newData.fatPercentage = '';
          newData.muscleMass = '';
        }
      }

      return newData;
    });

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  }, [error, user?.height, user?.gender]);

  const handleSubmit = useCallback(async () => {
    if (!token) {
      setError('No authentication token provided');
      return;
    }

    // Validate weight field only
    if (!formData.weight || !validateField(formData.weight)) {
      setError('Please enter a valid weight');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const dataToSubmit = {
        weight: parseFloat(formData.weight),
        muscleMass: formData.muscleMass ? parseFloat(formData.muscleMass) : null,
        fatPercentage: formData.fatPercentage ? parseFloat(formData.fatPercentage) : null
      };

      await api.post('/progress', dataToSubmit);

      setFormData({
        weight: '',
        muscleMass: '',
        fatPercentage: ''
      });

      if (onSubmit) {
        onSubmit();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit progress data');
    } finally {
      setLoading(false);
    }
  }, [token, formData, validateField, onSubmit]);

  const containerStyle = useMemo(() => [
    styles.container,
    { backgroundColor: theme.colors.background }
  ], [theme]);

  const inputStyle = useMemo(() => [
    styles.input,
    { borderColor: theme.colors.primary }
  ], [theme]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={containerStyle}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Track Your Progress</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={inputStyle}
              value={formData.weight}
              onChangeText={(value) => handleChange('weight', value)}
              placeholder="Enter weight"
              keyboardType="decimal-pad"
              editable={!loading}
              maxLength={6}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Muscle Mass (%)</Text>
            <TextInput
              style={inputStyle}
              value={formData.muscleMass}
              onChangeText={(value) => handleChange('muscleMass', value)}
              placeholder="Enter muscle mass"
              keyboardType="decimal-pad"
              editable={!loading}
              maxLength={5}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Body Fat (%)</Text>
            <TextInput
              style={inputStyle}
              value={formData.fatPercentage}
              onChangeText={(value) => handleChange('fatPercentage', value)}
              placeholder="Enter body fat"
              keyboardType="decimal-pad"
              editable={!loading}
              maxLength={5}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.colors.primary },
              loading && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={loading || disabled}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

ProgressInput.displayName = 'ProgressInput';

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollView: {
    padding: 20
  },
  formContainer: {
    width: '100%'
  },
  inputContainer: {
    marginBottom: 20
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15
  },
  submitButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  submitButtonDisabled: {
    opacity: 0.7
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  errorText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center'
  }
});

export default ProgressInput;