// frontend/components/ui/Input.js
import React, { useContext } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { inputVariants } from '../../styles/variants';

const Input = ({
  variant = 'default',
  label,
  error,
  placeholder,
  style,
  containerStyle,
  labelStyle,
  errorStyle,
  ...props
}) => {
  const { theme } = useContext(ThemeContext);

  const getVariantStyles = () => {
    const variantStyle = inputVariants[variant] || inputVariants.default;
    const styles = {};
    
    Object.entries(variantStyle).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes('.')) {
        const [category, token] = value.split('.');
        styles[key] = theme[category]?.[token] || value;
      } else {
        styles[key] = value;
      }
    });
    
    return styles;
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing[4],
    },
    label: {
      marginBottom: theme.spacing[2],
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.foreground,
    },
    input: {
      ...getVariantStyles(),
      fontSize: theme.fontSize.base,
      color: theme.colors.foreground,
    },
    error: {
      marginTop: theme.spacing[1],
      fontSize: theme.fontSize.sm,
      color: theme.colors.destructive.DEFAULT,
    },
    focusedInput: {
      borderColor: theme.colors.ring,
    },
    errorInput: {
      borderColor: theme.colors.destructive.DEFAULT,
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          error && styles.errorInput,
          style,
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted.foreground}
        {...props}
      />
      {error && (
        <Text style={[styles.error, errorStyle]}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default Input;
