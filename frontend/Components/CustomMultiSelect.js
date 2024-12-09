// frontend/Components/CustomMultiSelect.js

import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Portal, Text, Button, Checkbox, Chip, List, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Updated import
import PropTypes from 'prop-types'; // Added import

const CustomMultiSelect = ({
  label,
  items,
  selectedItems,
  onSelectedItemsChange,
  placeholder = 'Select options',
}) => {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  const styles = getStyles(theme);

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  const toggleItem = (id) => {
    if (selectedItems.includes(id)) {
      onSelectedItemsChange(selectedItems.filter((item) => item !== id));
    } else {
      onSelectedItemsChange([...selectedItems, id]);
    }
  };

  const renderSelectedChips = () => {
    return selectedItems.map((id) => {
      const item = items.find((item) => item.id === id);
      if (!item) return null;
      return (
        <Chip
          key={id}
          style={styles.chip}
          onClose={() => toggleItem(id)}
          textStyle={styles.chipText}
          closeIconColor={theme.colors.onPrimary}
        >
          {item.name}
        </Chip>
      );
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.selector} onPress={showModal}>
        {selectedItems.length > 0 ? (
          <View style={styles.chipsContainer}>{renderSelectedChips()}</View>
        ) : (
          <Text style={styles.placeholder}>{placeholder}</Text>
        )}
        <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.placeholder} />
      </TouchableOpacity>

      {/* Conditionally render the Portal based on 'visible' state */}
      {visible && (
        <Portal>
          <TouchableWithoutFeedback onPress={hideModal}>
            <View style={styles.backdrop}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{label}</Text>
                  <List.Section>
                    {items.map((item) => (
                      <List.Item
                        key={item.id}
                        title={item.name}
                        titleStyle={styles.listItemText}
                        left={() => (
                          <Checkbox
                            status={selectedItems.includes(item.id) ? 'checked' : 'unchecked'}
                            onPress={() => toggleItem(item.id)}
                            color={theme.colors.primary}
                            uncheckedColor={theme.colors.placeholder}
                          />
                        )}
                        onPress={() => toggleItem(item.id)}
                      />
                    ))}
                  </List.Section>
                  <Button
                    mode="contained"
                    onPress={hideModal}
                    style={styles.closeButton}
                    contentStyle={styles.closeButtonContent}
                    uppercase={false}
                  >
                    Close
                  </Button>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Portal>
      )}
    </View>
  );
};

// Define PropTypes for the component
CustomMultiSelect.propTypes = {
  label: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedItems: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelectedItemsChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

// Define defaultProps for optional props
CustomMultiSelect.defaultProps = {
  placeholder: 'Select options',
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      marginBottom: 15,
    },
    label: {
      fontSize: 16,
      marginBottom: 5,
      color: theme.colors.text,
    },
    selector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.colors.placeholder,
      borderRadius: 5,
      padding: 10,
      backgroundColor: theme.colors.background,
    },
    placeholder: {
      color: theme.colors.placeholder,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      flex: 1,
    },
    chip: {
      margin: 2,
      backgroundColor: theme.colors.primary,
    },
    chipText: {
      color: theme.colors.onPrimary,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent backdrop for better UX
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly transparent to see underlying content
      borderRadius: 10,
      padding: 20,
      maxHeight: '80%',
      width: '90%', // Adjust as needed
      // Optional: Add shadow or elevation for depth
      shadowColor: "#000",
      shadowOffset: {
          width: 0,
          height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
      color: theme.colors.text,
      textAlign: 'center',
    },
    closeButton: {
      marginTop: 10,
      alignSelf: 'flex-end',
    },
    closeButtonContent: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    listItemText: {
      color: theme.colors.text,
    },
  });

export default CustomMultiSelect;