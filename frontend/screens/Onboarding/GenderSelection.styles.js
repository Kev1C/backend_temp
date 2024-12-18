// styles/components/onboarding/GenderSelection.styles.js
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 20,
    padding: 8,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  optionsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  optionContainer: {
    width: '48%',
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedOptionFemale: {
    borderColor: '#FFB6C1',
    backgroundColor: '#FFF0F5', // Light pink background
  },
  selectedOptionMale: {
    borderColor: '#87CEEB',
    backgroundColor: '#F0F8FF', // Light blue background
  },
  optionText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  selectedTextFemale: {
    color: '#FF69B4', // Pink text when selected
  },
  selectedTextMale: {
    color: '#4169E1', // Blue text when selected
  },
  noneButton: {
    marginTop: 20,
    padding: 10,
  },
  noneButtonText: {
    color: '#666',
    fontSize: 14,
  },
  continueButton: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
  },
});

export default styles;