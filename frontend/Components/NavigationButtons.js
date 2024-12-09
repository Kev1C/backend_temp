// frontend/Components/NavigationButtons.js
import React from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';
import createStyles from './NavigationButtonsStyles';

const NavigationButtons = ({ navigation, theme }) => {
  const styles = createStyles(theme);

  const buttons = [
    { title: 'Resources', icon: 'book-open-page-variant', screen: 'Resources' },
    { title: 'Calculator', icon: 'calculator', screen: 'Calculator' },
    { title: 'Connect', icon: 'link', screen: 'Connect' },
    { title: 'Community', icon: 'account-supervisor', screen: 'Community' },
    { title: 'Exercises', icon: 'dumbbell', screen: 'Exercises' },
  ];

  return (
    <View style={styles.container}>
      {buttons.map((btn) => (
        <Button
          key={btn.title}
          mode="contained"
          icon={btn.icon}
          onPress={() => navigation.navigate(btn.screen)}
          style={styles.button}
          contentStyle={styles.buttonContent}
          accessibilityLabel={`Navigate to ${btn.title}`}
          accessibilityRole="button"
        >
          {btn.title}
        </Button>
      ))}
    </View>
  );
};

export default React.memo(NavigationButtons);
