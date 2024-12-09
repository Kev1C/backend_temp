// frontend/components/ui/Button.js
import React, { useContext } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { buttonVariants } from '../../styles/variants';

const Button = ({ 
  variant = 'default',
  size = 'default',
  children,
  disabled = false,
  onPress,
  style,
  ...props 
}) => {
  const { theme } = useContext(ThemeContext);
  
  const getVariantStyles = () => {
    const variantStyle = buttonVariants[variant] || buttonVariants.default;
    const styles = {};
    
    // Map theme tokens to actual values
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

  const getSizeStyles = () => {
    const sizes = {
      sm: theme.spacing[3],
      default: theme.spacing[4],
      lg: theme.spacing[5],
    };
    
    return {
      paddingVertical: sizes[size],
      paddingHorizontal: sizes[size] * 2,
    };
  };

  const buttonStyles = StyleSheet.create({
    button: {
      ...getVariantStyles(),
      ...getSizeStyles(),
      opacity: disabled ? 0.5 : 1,
    },
    text: {
      color: theme.colors[variant]?.foreground || '#ffffff',
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.medium,
      textAlign: 'center',
    },
  });

  return (
    <TouchableOpacity
      style={[buttonStyles.button, style]}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      <Text style={buttonStyles.text}>{children}</Text>
    </TouchableOpacity>
  );
};

export default Button;
