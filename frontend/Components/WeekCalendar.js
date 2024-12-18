import React, { useState, useContext, useCallback, useEffect, useMemo, memo } from 'react';
import { View, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import Typography, { Small, Label } from './Typography';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDate = (date) => ({
  day: days[date.getDay()],
  date: date.getDate().toString(),
});

const DateItem = memo(({ date, isToday, isSelected, onSelect, theme }) => {
  const formattedDate = useMemo(() => formatDate(date), [date]);
  const isActive = isToday || isSelected;
  
  const containerStyle = useMemo(() => [
    styles.dateContainer,
    isToday && styles.todayContainer(theme),
    isSelected && styles.selectedContainer(theme)
  ], [isToday, isSelected, theme]);

  const dayTextStyle = useMemo(() => [
    styles.dayText,
    { color: theme.colors.textSecondary },
    isActive && styles.activeText(theme)
  ], [theme, isActive]);

  const dateTextStyle = useMemo(() => [
    styles.dateText,
    { color: theme.colors.text },
    isActive && styles.activeText(theme)
  ], [theme, isActive]);
  
  const handlePress = useCallback(() => {
    onSelect(date);
  }, [date, onSelect]);

  return (
    <TouchableOpacity 
      style={styles.dayContainer}
      onPress={handlePress}
    >
      <View style={containerStyle}>
        <Small style={dayTextStyle}>
          {formattedDate.day}
        </Small>
        <Label style={dateTextStyle}>
          {formattedDate.date}
        </Label>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return prevProps.isToday === nextProps.isToday &&
         prevProps.isSelected === nextProps.isSelected &&
         prevProps.date.getTime() === nextProps.date.getTime() &&
         prevProps.theme === nextProps.theme;
});

const WeekCalendar = memo(({ onDateSelect, selectedDate }) => {
  const { theme } = useContext(ThemeContext);
  const [visibleDates, setVisibleDates] = useState([]);
  
  const dates = useMemo(() => {
    const today = new Date();
    const datesArray = [];
    
    // Show 2 weeks back
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 14); // 14 days = 2 weeks back
    
    // Show 1 day forward
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1); // 1 day forward
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateObj = new Date(currentDate);
      datesArray.push({
        date: dateObj,
        isToday: dateObj.toDateString() === today.toDateString(),
        isSelected: selectedDate && dateObj.toDateString() === selectedDate.toDateString()
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return datesArray;
  }, [selectedDate]);

  const handleDateSelect = useCallback((date) => {
    if (onDateSelect) {
      onDateSelect(new Date(date));
    }
  }, [onDateSelect]);

  const getItemLayout = useCallback((_, index) => ({
    length: 60,
    offset: 60 * index,
    index,
  }), []);

  const renderItem = useCallback(({ item }) => (
    <DateItem
      date={item.date}
      isToday={item.isToday}
      isSelected={item.isSelected}
      onSelect={handleDateSelect}
      theme={theme}
    />
  ), [theme, handleDateSelect]);

  const keyExtractor = useCallback((item) => item.date.toISOString(), []);

  const initialScrollIndex = useMemo(() => {
    return dates.findIndex(d => d.isToday);
  }, [dates]);

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={dates}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        initialScrollIndex={initialScrollIndex}
        initialNumToRender={7}
        maxToRenderPerBatch={7}
        windowSize={7}
        removeClippedSubviews={true}
        contentContainerStyle={styles.scrollContainer}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginVertical: 8,
  },
  scrollContainer: {
    paddingHorizontal: 8,
  },
  dayContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  dateContainer: {
    width: '100%',
    height: 70,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dayText: {
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
  },
  todayContainer: theme => ({
    backgroundColor: theme.colors.primary + '15',
  }),
  selectedContainer: theme => ({
    backgroundColor: theme.colors.primary + '30',
  }),
  activeText: theme => ({
    color: theme.colors.primary,
  }),
});

export default WeekCalendar;
