// styles/common/GenderSelection.styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
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
    marginBottom: 40,
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
    backgroundColor: '#FFF0F5',
  },
  selectedOptionMale: {
    borderColor: '#87CEEB',
    backgroundColor: '#F0F8FF',
  },
  optionText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  selectedTextFemale: {
    color: '#FF69B4',
  },
  selectedTextMale: {
    color: '#87CEEB',
  },
  noneButton: {
    marginTop: 16,
  },
  noneButtonText: {
    color: '#666',
    fontSize: 14,
  },
  buttonContainer: {
    paddingHorizontal: 24,
  },
  continueButton: {
    marginBottom: 20,
  },
});