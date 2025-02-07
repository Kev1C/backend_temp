// frontend/screens/Home/ResourcesScreen.js

import React from 'react';
import { View, Text, Linking, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FlashList } from '@shopify/flash-list';
import styles from './ResourcesScreenStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ResourcesScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const resources = [
    {
      id: '1',
      title: 'Bodybuilding.com Exercises',
      url: 'https://www.bodybuilding.com/exercises',
      icon: 'dumbbell',
    },
    {
      id: '2',
      title: 'MuscleWiki',
      url: 'https://musclewiki.com/',
      icon: 'dumbbell',
    },
    {
      id: '3',
      title: 'Custom Resource',
      url: 'https://d3ta25z7nz02qv.cloudfront.net/',
      icon: 'web',
    },
    {
      id: '4',
      title: 'ExRx.net',
      url: 'https://exrx.net/',
      icon: 'dumbbell',
    },
    {
      id: '5',
      title: 'FreeTrainers',
      url: 'https://www.freetrainers.com/exercise/muscle/',
      icon: 'account-group',
    },
    {
      id: '6',
      title: 'Fitbod Exercises',
      url: 'https://fitbod.me/exercises',
      icon: 'weight-lifter',
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
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <FlashList
        data={resources}
        renderItem={renderItem}
        estimatedItemSize={70} // Adjust this value based on your item's average height
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
};

export default ResourcesScreen;