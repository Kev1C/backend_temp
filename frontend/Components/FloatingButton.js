// frontend/Components/FloatingButton.js

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';

const FloatingButton = ({ onPress, iconName, label, style }) => {
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <TouchableOpacity
      style={[styles.floatingButton, style]}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Icon name={iconName} size={20} color={styles.text.color} />
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    floatingButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      padding: 10,
      borderRadius: 25,
      position: 'absolute',
      bottom: 20,
      right: 20,
      elevation: 5,
    },
    text: {
      color: theme.colors.background,
      marginLeft: 5,
      fontSize: 16,
    },
  });

export default FloatingButton;