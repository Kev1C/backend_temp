// frontend/Components/FilterModal.js

import React, { useContext } from 'react';
import { 
  View, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Platform
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import Typography, { H2, Body, Small } from './Typography';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomMultiSelect from './CustomMultiSelect';

const FilterModal = ({ 
  visible, 
  onClose,
  filters,
  onApplyFilters
}) => {
  const { theme } = useContext(ThemeContext);

  const {
    muscleGroups = [],
    equipment = [],
    difficulty = '',
    duration = '',
    calories = ''
  } = filters;

  const muscleOptions = [
    'Chest',
    'Back',
    'Shoulders',
    'Biceps',
    'Triceps',
    'Legs',
    'Core',
    'Full Body'
  ];

  const equipmentOptions = [
    'No Equipment',
    'Dumbbells',
    'Barbell',
    'Kettlebell',
    'Resistance Bands',
    'Machine',
    'Cable',
    'Bodyweight'
  ];

  const difficultyOptions = [
    { label: 'All Levels', value: '' },
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' }
  ];

  const durationOptions = [
    { label: 'Any Duration', value: '' },
    { label: 'Under 15 min', value: '0-15' },
    { label: '15-30 min', value: '15-30' },
    { label: 'Over 30 min', value: '30+' }
  ];

  const calorieOptions = [
    { label: 'Any Calories', value: '' },
    { label: 'Under 100', value: '0-100' },
    { label: '100-200', value: '100-200' },
    { label: '200-300', value: '200-300' },
    { label: 'Over 300', value: '300+' }
  ];

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    onApplyFilters({
      muscleGroups: [],
      equipment: [],
      difficulty: '',
      duration: '',
      calories: ''
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[
        styles.modalContainer,
        { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
      ]}>
        <View style={[
          styles.modalContent,
          { 
            backgroundColor: theme.colors.background,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              },
              android: {
                elevation: 4,
              },
            }),
          }
        ]}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: theme.colors.surface }
              ]}
            >
              <Icon 
                name="close" 
                size={24} 
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <H2 style={[styles.title, { color: theme.colors.text }]}>
                Filter Exercises
              </H2>

              <View style={styles.section}>
                <Body style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Muscle Groups
                </Body>
                <Small style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                  Select target muscle groups
                </Small>
                <CustomMultiSelect
                  options={muscleOptions}
                  selectedValues={muscleGroups}
                  onSelectionChange={(selected) => onApplyFilters({ ...filters, muscleGroups: selected })}
                  style={styles.multiSelect}
                />
              </View>

              <View style={styles.section}>
                <Body style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Equipment
                </Body>
                <Small style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                  Select available equipment
                </Small>
                <CustomMultiSelect
                  options={equipmentOptions}
                  selectedValues={equipment}
                  onSelectionChange={(selected) => onApplyFilters({ ...filters, equipment: selected })}
                  style={styles.multiSelect}
                />
              </View>

              <View style={styles.section}>
                <Body style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Difficulty Level
                </Body>
                <View style={styles.optionsRow}>
                  {difficultyOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        { 
                          backgroundColor: difficulty === option.value ? 
            theme.colors.primary : theme.colors.surface,
                          borderColor: theme.colors.border
                        }
                      ]}
                      onPress={() => onApplyFilters({ ...filters, difficulty: option.value })}
                    >
                      <Typography style={{ 
                        color: difficulty === option.value ? 
                          theme.colors.onPrimary : theme.colors.text 
                      }}>
                        {option.label}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Body style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Duration
                </Body>
                <View style={styles.optionsRow}>
                  {durationOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        { 
                          backgroundColor: duration === option.value ? 
            theme.colors.primary : theme.colors.surface,
                          borderColor: theme.colors.border
                        }
                      ]}
                      onPress={() => onApplyFilters({ ...filters, duration: option.value })}
                    >
                      <Typography style={{ 
                        color: duration === option.value ? 
                          theme.colors.onPrimary : theme.colors.text 
                      }}>
                        {option.label}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Body style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Calories
                </Body>
                <View style={styles.optionsRow}>
                  {calorieOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        { 
                          backgroundColor: calories === option.value ? 
            theme.colors.primary : theme.colors.surface,
                          borderColor: theme.colors.border
                        }
                      ]}
                      onPress={() => onApplyFilters({ ...filters, calories: option.value })}
                    >
                      <Typography style={{ 
                        color: calories === option.value ? 
                          theme.colors.onPrimary : theme.colors.text 
                      }}>
                        {option.label}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={[
            styles.footer,
            { 
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border
            }
          ]}>
            <TouchableOpacity 
              onPress={handleReset}
              style={[
                styles.footerButton,
                { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }
              ]}
            >
              <Typography style={{ color: theme.colors.text }}>
                Reset
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleApply}
              style={[
                styles.footerButton,
                { backgroundColor: theme.colors.primary }
              ]}
            >
              <Typography style={{ color: theme.colors.onPrimary }}>
                Apply Filters
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    padding: 16,
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionSubtitle: {
    marginBottom: 12,
  },
  multiSelect: {
    marginTop: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginHorizontal: -4,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    margin: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
  },
});

export default FilterModal;