// frontend/components/ui/Select.js
import React, { useContext, useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Modal, 
  FlatList,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { inputVariants } from '../../styles/variants';

const Select = ({
  label,
  placeholder = 'Select an option',
  options = [],
  value,
  onChange,
  error,
  variant = 'default',
  style,
  containerStyle,
  labelStyle,
  errorStyle,
  ...props
}) => {
  const { theme } = useContext(ThemeContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [animation] = useState(new Animated.Value(0));

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
    select: {
      ...getVariantStyles(),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectText: {
      fontSize: theme.fontSize.base,
      color: value ? theme.colors.foreground : theme.colors.muted.foreground,
    },
    error: {
      marginTop: theme.spacing[1],
      fontSize: theme.fontSize.sm,
      color: theme.colors.destructive.DEFAULT,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.radius.lg,
      borderTopRightRadius: theme.radius.lg,
      paddingBottom: theme.spacing[4],
      maxHeight: '70%',
    },
    modalHeader: {
      padding: theme.spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalHeaderText: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.foreground,
    },
    option: {
      padding: theme.spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    optionText: {
      fontSize: theme.fontSize.base,
      color: theme.colors.foreground,
    },
    selectedOption: {
      backgroundColor: theme.colors.primary.DEFAULT + '10',
    },
    selectedOptionText: {
      color: theme.colors.primary.DEFAULT,
      fontWeight: theme.fontWeight.medium,
    },
  });

  const animateModal = (toValue) => {
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const handleOpen = () => {
    setModalVisible(true);
    animateModal(1);
  };

  const handleClose = () => {
    animateModal(0);
    setTimeout(() => setModalVisible(false), 200);
  };

  const handleSelect = (option) => {
    onChange(option);
    handleClose();
  };

  const selectedOption = options.find(option => option.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        style={[styles.select, style]}
        onPress={handleOpen}
        activeOpacity={0.7}
        {...props}
      >
        <Text style={styles.selectText}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        {/* Add a chevron icon here if needed */}
      </TouchableOpacity>

      {error && (
        <Text style={[styles.error, errorStyle]}>
          {error}
        </Text>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>{label || 'Select an option'}</Text>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === value && styles.selectedOption,
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.selectedOptionText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Select;
