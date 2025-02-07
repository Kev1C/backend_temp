import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

const PROGRESS_CATEGORIES = [
  { key: 'Weight', label: 'Weight', color: '#5CB1F6' },
  { key: 'MuscleMass', label: 'Muscle Mass', color: '#6EE7B7' },
  { key: 'BodyFat', label: 'Body Fat', color: '#A569BD' },
];

const CategoryToggle = ({ selectedCategories, onToggleCategory }) => {
  return (
    <View style={styles.container}>
      {PROGRESS_CATEGORIES.map((category) => (
        <Chip
          key={category.key}
          selected={selectedCategories.includes(category.key)}
          onPress={() => onToggleCategory(category.key)}
          style={[
            styles.chip,
            {
              backgroundColor: selectedCategories.includes(category.key)
                ? category.color
                : 'transparent',
            },
          ]}
          textStyle={{
            color: selectedCategories.includes(category.key) ? '#fff' : '#000',
          }}
        >
          {category.label}
        </Chip>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginTop: 16,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chip: {
    marginHorizontal: 4,
  },
});

export { PROGRESS_CATEGORIES };
export default CategoryToggle;
