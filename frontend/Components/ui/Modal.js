// frontend/components/ui/Modal.js
import React, { useContext, useEffect } from 'react';
import { 
  Modal as RNModal, 
  View, 
  TouchableOpacity, 
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';

const Modal = ({
  visible = false,
  onClose,
  children,
  position = 'center',
  style,
  contentStyle,
  ...props
}) => {
  const { theme } = useContext(ThemeContext);
  const animation = new Animated.Value(0);
  const { height } = Dimensions.get('window');

  useEffect(() => {
    if (visible) {
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getModalPosition = () => {
    switch (position) {
      case 'bottom':
        return {
          justifyContent: 'flex-end',
          transform: [{
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [height, 0],
            }),
          }],
        };
      case 'top':
        return {
          justifyContent: 'flex-start',
          transform: [{
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [-height, 0],
            }),
          }],
        };
      default:
        return {
          justifyContent: 'center',
          transform: [{
            scale: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            }),
          }],
          opacity: animation,
        };
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      ...getModalPosition(),
    },
    content: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      margin: theme.spacing[4],
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
  });

  return (
    <RNModal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
      {...props}
    >
      <TouchableOpacity
        style={[styles.overlay, style]}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.content,
            contentStyle,
            {
              transform: getModalPosition().transform,
              opacity: position === 'center' ? animation : 1,
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1}>
            {children}
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </RNModal>
  );
};

// Convenience components for modal parts
export const ModalHeader = ({ children, style, ...props }) => {
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

export const ModalFooter = ({ children, style, ...props }) => {
  const { theme } = useContext(ThemeContext);
  
  const styles = StyleSheet.create({
    footer: {
      marginTop: theme.spacing[4],
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: theme.spacing[2],
    },
  });

  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
};

export default Modal;
