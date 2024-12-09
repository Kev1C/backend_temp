// frontend/components/ui/Card.js
import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { cardVariants } from '../../styles/variants';

export const Card = ({ 
  variant = 'default',
  children,
  style,
  ...props 
}) => {
  const { theme } = useContext(ThemeContext);

  const getVariantStyles = () => {
    const variantStyle = cardVariants[variant] || cardVariants.default;
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

  const cardStyles = StyleSheet.create({
    card: {
      ...getVariantStyles(),
    },
  });

  return (
    <View style={[cardStyles.card, style]} {...props}>
      {children}
    </View>
  );
};

// Card Header component
export const CardHeader = ({ children, style, ...props }) => {
  const { theme } = useContext(ThemeContext);
  
  const styles = StyleSheet.create({
    header: {
      marginBottom: theme.spacing[4],
    },
  });

  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
};

// Card Title component
export const CardTitle = ({ children, style, ...props }) => {
  const { theme } = useContext(ThemeContext);
  
  const styles = StyleSheet.create({
    title: {
      fontSize: theme.fontSize['xl'],
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.card.foreground,
    },
  });

  return (
    <View style={[styles.title, style]} {...props}>
      {children}
    </View>
  );
};

// Card Content component
export const CardContent = ({ children, style, ...props }) => {
  const { theme } = useContext(ThemeContext);
  
  const styles = StyleSheet.create({
    content: {
      paddingVertical: theme.spacing[2],
    },
  });

  return (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );
};

// Card Footer component
export const CardFooter = ({ children, style, ...props }) => {
  const { theme } = useContext(ThemeContext);
  
  const styles = StyleSheet.create({
    footer: {
      marginTop: theme.spacing[4],
    },
  });

  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
};
