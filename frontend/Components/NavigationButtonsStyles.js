// frontend/Components/styles/NavigationButtonsStyles.js
import { StyleSheet, Dimensions } from 'react-native';

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 16,
    },
    button: {
      marginVertical: 8,
      width: '48%', // Two buttons per row
    },
    buttonContent: {
      flexDirection: 'row-reverse',
    },
  });

export default createStyles;