// frontend/screens/Home/CommunityScreen.js
import React from 'react';
import { View, Text } from 'react-native';
import styles from './CommunityScreenStyles'; // Import the separate styles
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CommunityScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.text}>Community Screen in development</Text>
    </View>
  );
};

export default CommunityScreen;