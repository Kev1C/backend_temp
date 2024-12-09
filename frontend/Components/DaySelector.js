// frontend/Component/DaySelector.js
import React from 'react';
import { View } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';

const DaySelector = ({ selectedDays, toggleDay, days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }) => {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
      {days.map((day) => (
        <Chip
          key={day}
          onPress={() => toggleDay(day)}
          selected={selectedDays.includes(day)}
          style={[
            { margin: 4 },
            selectedDays.includes(day) && { backgroundColor: theme.colors.primary },
          ]}
          selectedColor="#fff"
          textStyle={{ color: selectedDays.includes(day) ? '#fff' : theme.colors.primary }}
        >
          {day}
        </Chip>
      ))}
    </View>
  );
};

export default DaySelector;