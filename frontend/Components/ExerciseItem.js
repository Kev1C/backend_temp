// /frontend/Components/ExerciseItem.js

import React, { useContext } from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import Typography, { H3, Small } from './Typography';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ExerciseItem = ({ 
  exercise, 
  onPress, 
  selected,
  showMetrics = true,
  style 
}) => {
  const { theme } = useContext(ThemeContext);

  const { 
    name, 
    muscleGroups = [], 
    equipment = 'No equipment',
    difficulty = 'Beginner',
    imageUrl,
    calories = '150-200',
    duration = '10-15'
  } = exercise;

  const getDifficultyColor = () => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return theme.colors.success;
      case 'intermediate':
        return theme.colors.warning;
      case 'advanced':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getEquipmentIcon = () => {
    switch (equipment.toLowerCase()) {
      case 'dumbbells':
        return 'dumbbell';
      case 'barbell':
        return 'weight-lifter';
      case 'kettlebell':
        return 'weight';
      case 'resistance bands':
        return 'bandage';
      case 'bodyweight':
      case 'no equipment':
        return 'account';
      default:
        return 'dumbbell';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
        selected && styles.selectedContainer,
        style
      ]}
    >
      <View style={styles.content}>
        {imageUrl && (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.image}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.details}>
          <H3 
            style={[
              styles.name,
              { color: theme.colors.text }
            ]}
            numberOfLines={1}
          >
            {name}
          </H3>

          <View style={styles.muscleGroups}>
            {muscleGroups.map((muscle, index) => (
              <View
                key={index}
                style={[
                  styles.tag,
                  { backgroundColor: theme.colors.primary + '15' }
                ]}
              >
                <Small style={{ color: theme.colors.primary }}>
                  {muscle}
                </Small>
              </View>
            ))}
          </View>

          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Icon 
                name={getEquipmentIcon()} 
                size={16} 
                color={theme.colors.textSecondary}
                style={styles.metaIcon}
              />
              <Typography 
                style={[
                  styles.metaText,
                  { color: theme.colors.textSecondary }
                ]}
              >
                {equipment}
              </Typography>
            </View>

            <View style={styles.metaItem}>
              <Icon 
                name="signal" 
                size={16} 
                color={getDifficultyColor()}
                style={styles.metaIcon}
              />
              <Typography 
                style={[
                  styles.metaText,
                  { color: getDifficultyColor() }
                ]}
              >
                {difficulty}
              </Typography>
            </View>
          </View>

          {showMetrics && (
            <View style={styles.metrics}>
              <View style={styles.metricItem}>
                <Icon 
                  name="fire" 
                  size={16} 
                  color={theme.colors.primary}
                  style={styles.metricIcon}
                />
                <Small style={{ color: theme.colors.textSecondary }}>
                  {calories} cal
                </Small>
              </View>

              <View style={styles.metricItem}>
                <Icon 
                  name="clock-outline" 
                  size={16} 
                  color={theme.colors.primary}
                  style={styles.metricIcon}
                />
                <Small style={{ color: theme.colors.textSecondary }}>
                  {duration} min
                </Small>
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  selectedContainer: {
    borderWidth: 2,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    marginBottom: 4,
  },
  muscleGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metricIcon: {
    marginRight: 4,
  },
});

export default ExerciseItem;