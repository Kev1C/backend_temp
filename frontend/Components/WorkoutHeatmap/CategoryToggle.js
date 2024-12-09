// frontend/Components/WorkoutHeatmap/CategoryToggle.js

import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import styles from './WorkoutHeatmap.styles';

const CategoryToggle = ({ categories, selectedCategories, toggleCategory, theme }) => (
  <View style={styles.categoryContainer}>
    {categories.map(({ key, label }) => (
      <TouchableOpacity
        key={key}
        style={[
          styles.categoryButton,
          {
            backgroundColor: selectedCategories.includes(key)
              ? theme.colors.primary
              : theme.colors.disabled,
          },
        ]}
        onPress={() => toggleCategory(key)}
        accessibilityLabel={`Toggle ${label}`}
        accessibilityRole="button"
      >
        <Text style={styles.categoryButtonText}>{label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default CategoryToggle;