// frontend/Components/WorkoutHeatmap/MuscleGroupPicker.js

import React from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import styles from './WorkoutHeatmap.styles';

const MuscleGroupPicker = ({ selectedMuscleGroup, setSelectedMuscleGroup, muscleGroups, theme }) => (
  <View style={styles.pickerContainer}>
    <Text style={[styles.pickerLabel, { color: theme.colors.text }]}>
      Muscle Group:
    </Text>
    <Picker
      selectedValue={selectedMuscleGroup}
      style={[styles.picker, { color: theme.colors.text }]}
      onValueChange={itemValue => setSelectedMuscleGroup(itemValue)}
      mode="dropdown"
    >
      {muscleGroups.map(group => (
        <Picker.Item label={group} value={group} key={group} />
      ))}
    </Picker>
  </View>
);

export default MuscleGroupPicker;
