// frontend/screens/Home/ResourcesScreen.js

import React from 'react';
import { View, Text, FlatList, Linking, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Ensure this is installed
import styles from './ResourcesScreenStyles'; // Import the styles

const ResourcesScreen = () => {
  const theme = useTheme(); // Access the current theme

  const resources = [
    {
      id: '1', // Added unique ID
      title: 'Bodybuilding.com Exercises',
      url: 'https://www.bodybuilding.com/exercises',
      icon: 'dumbbell', // Consistent with fitness theme
    },
    {
      id: '2',
      title: 'MuscleWiki',
      url: 'https://musclewiki.com/',
      icon: 'dumbbell', // Represents muscles; adjust if a better icon exists
    },
    {
      id: '3',
      title: 'Custom Resource',
      url: 'https://d3ta25z7nz02qv.cloudfront.net/',
      icon: 'web', // Generic web icon for unspecified resources
    },
    {
      id: '4',
      title: 'ExRx.net',
      url: 'https://exrx.net/',
      icon: 'dumbbell', // Represents exercises and fitness
    },
    {
      id: '5',
      title: 'FreeTrainers',
      url: 'https://www.freetrainers.com/exercise/muscle/',
      icon: 'account-group', // Represents trainers or group exercises
    },
    {
      id: '6',
      title: 'Fitbod Exercises',
      url: 'https://fitbod.me/exercises',
      icon: 'weight-lifter', // Represents weightlifting exercises
    },
    // Add more resources as needed
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemContainer, { borderColor: theme.colors.border }]}
      onPress={() => Linking.openURL(item.url)}
      accessibilityLabel={`Open resource: ${item.title}`}
      accessibilityRole="link"
    >
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.link, { color: theme.colors.primary }]}>Visit</Text>
      </View>
      <Icon
        name="open-in-new"
        size={20}
        color={theme.colors.primary}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={resources}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
};

export default ResourcesScreen;