// frontend/Components/ListHeader.js
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import createStyles from '../screens/Home/HomeScreenStyles';

const ListHeader = React.memo(
  ({ subtitle }) => {
    const theme = useTheme();
    const styles = createStyles(theme);

    return (
      <View style={styles.headerContainer}>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    );
  }
);

export default ListHeader;
