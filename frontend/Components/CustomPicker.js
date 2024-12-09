// frontend/Components/CustomPicker.js
import React, { useContext } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import Typography, { Label } from './Typography';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CustomPicker = ({ 
  value, 
  options, 
  onValueChange,
  label,
  error,
  style
}) => {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Label 
          style={[
            styles.label,
            { color: error ? theme.colors.error : theme.colors.textSecondary }
          ]}
        >
          {label}
        </Label>
      )}
      <View style={[
        styles.pickerContainer,
        { 
          backgroundColor: theme.colors.surface,
          borderColor: error ? theme.colors.error : theme.colors.border 
        }
      ]}>
        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                value === option.value && {
                  backgroundColor: theme.colors.primary + '15'
                },
                index !== options.length - 1 && styles.optionBorder
              ]}
              onPress={() => onValueChange(option.value)}
            >
              <View style={styles.optionContent}>
                {option.icon && (
                  <Icon 
                    name={option.icon} 
                    size={24} 
                    color={value === option.value ? theme.colors.primary : theme.colors.text}
                    style={styles.optionIcon}
                  />
                )}
                <Typography
                  style={[
                    styles.optionText,
                    { color: value === option.value ? theme.colors.primary : theme.colors.text }
                  ]}
                >
                  {option.label}
                </Typography>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {error && (
        <Typography
          style={[
            styles.errorText,
            { color: theme.colors.error }
          ]}
        >
          {error}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionsContainer: {
    flexDirection: 'row',
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  optionBorder: {
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    marginRight: 4,
  },
  optionText: {
    textAlign: 'center',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
  },
});

export default CustomPicker;