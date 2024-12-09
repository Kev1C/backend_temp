// frontend/Components/SearchHeader.js

import React, { useContext } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SearchHeader = ({ 
  value, 
  onChangeText, 
  onFilterPress,
  placeholder = 'Search exercises...',
  style 
}) => {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.searchContainer,
        { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }
      ]}>
        <Icon 
          name="magnify" 
          size={24} 
          color={theme.colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          style={[
            styles.input,
            { color: theme.colors.text }
          ]}
        />
        {value.length > 0 && (
          <TouchableOpacity 
            onPress={() => onChangeText('')}
            style={styles.clearButton}
          >
            <Icon 
              name="close-circle" 
              size={20} 
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        onPress={onFilterPress}
        style={[
          styles.filterButton,
          { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }
        ]}
      >
        <Icon 
          name="filter-variant" 
          size={24} 
          color={theme.colors.text}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginRight: 12,
  },
  searchIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    paddingRight: 8,
  },
  clearButton: {
    padding: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchHeader;