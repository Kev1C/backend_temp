// frontend/Components/Typography.js
import React, { useContext } from 'react';
import { Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';

const Typography = ({
  variant = 'body',
  color,
  align = 'left',
  children,
  style,
  ...props
}) => {
  const { theme } = useContext(ThemeContext);

  const getVariantStyles = () => {
    const variants = {
      h1: {
        fontSize: theme.fontSize['3xl'],
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing[4],
      },
      h2: {
        fontSize: theme.fontSize['2xl'],
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing[3],
      },
      h3: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing[2],
      },
      body: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.normal,
        color: theme.colors.text,
      },
      bodySecondary: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.normal,
        color: theme.colors.textSecondary,
      },
      small: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.normal,
        color: theme.colors.textSecondary,
      },
      label: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text,
        marginBottom: theme.spacing[1],
      },
      stat: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.primary,
      },
    };

    return variants[variant] || variants.body;
  };

  const getColorStyle = () => {
    if (!color) return {};
    return { color: theme.colors[color] || color };
  };

  const styles = StyleSheet.create({
    text: {
      ...getVariantStyles(),
      ...getColorStyle(),
      textAlign: align,
    },
  });

  return (
    <Text style={[styles.text, style]} {...props}>
      {children}
    </Text>
  );
};

// Convenience components for common typography variants
export const H1 = (props) => <Typography variant="h1" {...props} />;
export const H2 = (props) => <Typography variant="h2" {...props} />;
export const H3 = (props) => <Typography variant="h3" {...props} />;
export const Body = (props) => <Typography variant="body" {...props} />;
export const BodySecondary = (props) => <Typography variant="bodySecondary" {...props} />;
export const Small = (props) => <Typography variant="small" {...props} />;
export const Label = (props) => <Typography variant="label" {...props} />;
export const Stat = (props) => <Typography variant="stat" {...props} />;

export default Typography;
