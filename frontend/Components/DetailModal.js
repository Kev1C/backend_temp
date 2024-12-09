// frontend/Components/DetailModal.js

import React, { useContext } from 'react';
import { 
  View, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Image,
  Linking,
  Platform
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import Typography, { H2, H3, Body, Small } from './Typography';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const DetailModal = ({ 
  visible, 
  onClose,
  exercise,
  onStartWorkout
}) => {
  const { theme } = useContext(ThemeContext);

  const { 
    name,
    description,
    muscleGroups = [],
    equipment = 'No equipment',
    difficulty = 'Beginner',
    imageUrl,
    videoUrl,
    calories = '150-200',
    duration = '10-15',
    instructions = [],
    tips = []
  } = exercise || {};

  const handleVideoPress = async () => {
    if (videoUrl) {
      const canOpen = await Linking.canOpenURL(videoUrl);
      if (canOpen) {
        await Linking.openURL(videoUrl);
      }
    }
  };

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

  if (!exercise) return null;

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
            {imageUrl && (
              <Image 
                source={{ uri: imageUrl }} 
                style={styles.image}
                resizeMode="cover"
              />
            )}

            <View style={styles.content}>
              <H2 style={[styles.title, { color: theme.colors.text }]}>
                {name}
              </H2>

              <View style={styles.tags}>
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
                    name="dumbbell" 
                    size={20} 
                    color={theme.colors.textSecondary}
                    style={styles.metaIcon}
                  />
                  <Typography style={{ color: theme.colors.textSecondary }}>
                    {equipment}
                  </Typography>
                </View>

                <View style={styles.metaItem}>
                  <Icon 
                    name="signal" 
                    size={20} 
                    color={getDifficultyColor()}
                    style={styles.metaIcon}
                  />
                  <Typography style={{ color: getDifficultyColor() }}>
                    {difficulty}
                  </Typography>
                </View>
              </View>

              <View style={styles.metrics}>
                <View style={styles.metricItem}>
                  <Icon 
                    name="fire" 
                    size={20} 
                    color={theme.colors.primary}
                    style={styles.metricIcon}
                  />
                  <View>
                    <Small style={{ color: theme.colors.textSecondary }}>
                      Calories
                    </Small>
                    <Typography style={{ color: theme.colors.text }}>
                      {calories} cal
                    </Typography>
                  </View>
                </View>

                <View style={styles.metricItem}>
                  <Icon 
                    name="clock-outline" 
                    size={20} 
                    color={theme.colors.primary}
                    style={styles.metricIcon}
                  />
                  <View>
                    <Small style={{ color: theme.colors.textSecondary }}>
                      Duration
                    </Small>
                    <Typography style={{ color: theme.colors.text }}>
                      {duration} min
                    </Typography>
                  </View>
                </View>
              </View>

              {description && (
                <View style={styles.section}>
                  <H3 style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Description
                  </H3>
                  <Body style={{ color: theme.colors.text }}>
                    {description}
                  </Body>
                </View>
              )}

              {instructions.length > 0 && (
                <View style={styles.section}>
                  <H3 style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Instructions
                  </H3>
                  {instructions.map((instruction, index) => (
                    <View key={index} style={styles.instructionItem}>
                      <View style={[
                        styles.instructionNumber,
                        { backgroundColor: theme.colors.primary + '15' }
                      ]}>
                        <Small style={{ color: theme.colors.primary }}>
                          {index + 1}
                        </Small>
                      </View>
                      <Body style={[
                        styles.instructionText,
                        { color: theme.colors.text }
                      ]}>
                        {instruction}
                      </Body>
                    </View>
                  ))}
                </View>
              )}

              {tips.length > 0 && (
                <View style={styles.section}>
                  <H3 style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Tips
                  </H3>
                  {tips.map((tip, index) => (
                    <View key={index} style={styles.tipItem}>
                      <Icon 
                        name="lightbulb-outline" 
                        size={20} 
                        color={theme.colors.warning}
                        style={styles.tipIcon}
                      />
                      <Body style={[
                        styles.tipText,
                        { color: theme.colors.text }
                      ]}>
                        {tip}
                      </Body>
                    </View>
                  ))}
                </View>
              )}

              {videoUrl && (
                <TouchableOpacity 
                  onPress={handleVideoPress}
                  style={[
                    styles.videoButton,
                    { backgroundColor: theme.colors.primary + '15' }
                  ]}
                >
                  <Icon 
                    name="play-circle-outline" 
                    size={24} 
                    color={theme.colors.primary}
                    style={styles.videoIcon}
                  />
                  <Typography style={{ color: theme.colors.primary }}>
                    Watch Video Tutorial
                  </Typography>
                </TouchableOpacity>
              )}
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
              onPress={onStartWorkout}
              style={[
                styles.startButton,
                { backgroundColor: theme.colors.primary }
              ]}
            >
              <Typography style={{ color: theme.colors.onPrimary }}>
                Start Exercise
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
  image: {
    width: '100%',
    height: 240,
  },
  content: {
    padding: 24,
  },
  title: {
    marginBottom: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  metaIcon: {
    marginRight: 8,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    marginRight: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionText: {
    flex: 1,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tipIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  videoIcon: {
    marginRight: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  startButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});

export default DetailModal;