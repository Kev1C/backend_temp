// frontend/screens/Home/HomeScreenStyles.js

import { StyleSheet } from 'react-native';

const createStyles = (theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flexGrow: 1,
      padding: 20,
      paddingBottom: 40,
    },
    logo: {
      width: 50,
      height: 50,
      resizeMode: 'contain',
      position: 'absolute',
      top: 25,
      left: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
      color: theme.colors.text,
    },
    calendarContainer: {
      marginTop: 15,
    },
    carouselContainer: {
      height: 320, // Reduced from 400 to 350
      marginBottom: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 10, // Position dots below the carousel
    },
    paginationDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#C4C4C4',
      marginHorizontal: 4,
    },
    activePaginationDot: {
      backgroundColor: theme.colors.primary,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginVertical: 10,
      paddingHorizontal: 5,
    },
    recentMealsContainer: {
      flex: 1,
      paddingTop: 5,
    },
    buttonContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap', // Allow wrapping to the next line if necessary
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    actionButton: {
      width: '48%', // Fit two buttons per row
      marginVertical: 5,
    },
    buttonContent: {
      height: 50, // Consistent button height
      justifyContent: 'center',
    },
    fullWidthButton: {
      width: '100%', // Stretch across the container
      borderRadius: 5,
      marginTop: 10,
    },
    card: {
      borderRadius: 10,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      padding: 10,
      backgroundColor: theme.colors.surface,
      marginTop: 10,
      marginBottom: 20, // Gap below the card
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    cardText: {
      fontSize: 16,
      marginBottom: 5,
      color: theme.colors.text,
    },
    progressBar: {
      height: 10,
      borderRadius: 5,
      marginVertical: 10,
    },
    exerciseItem: {
      marginBottom: 10,
    },
    friendItem: {
      marginBottom: 15,
    },
    waterTrackerContent: {
      alignItems: 'center',
    },
    waterText: {
      fontSize: 18,
      marginBottom: 10,
    },
    waterButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    waterButton: {
      flex: 1,
      marginHorizontal: 5,
    },
    calorieButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 10,
    },
    calorieButton: {
      flex: 1,
      marginHorizontal: 5,
    },
    stepsButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 10,
    },
    stepsButton: {
      flex: 1,
      marginHorizontal: 5,
    },
    addExerciseButton: {
      marginTop: 10,
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary,
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // New card layout styles
    newCardContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    newCardScrollView: {
      flex: 1,
      padding: 16,
    },
    newCard: {
      marginVertical: 8,
      elevation: 4,
      borderRadius: 12,
    },
    newCalendarContainer: {
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    newFab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary,
    },
    headerContainer: {
      padding: 16,
      backgroundColor: theme.colors.surface,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: 8,
    },
  });

export default createStyles;