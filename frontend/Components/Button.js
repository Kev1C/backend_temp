// components/common/Button.js
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import styles from './Button.styles';

const Button = ({ title, style, ...props }) => {
  return (
    <TouchableOpacity style={[styles.button, style]} {...props}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

export default Button;