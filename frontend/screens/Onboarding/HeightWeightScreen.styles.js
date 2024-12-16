import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Changed to white background
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
  },
  skipButton: {
    color: '#666', // Changed text color
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    color: '#000', // Changed text color to black
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666', // Changed text color
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 40,
  },
  inputContainer: {
    flex: 1,
    gap: 30,
  },
  measurementContainer: {
    gap: 15,
  },
  label: {
    color: '#000', // Changed text color to black
    fontSize: 16,
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weightValue: {
    color: '#000', // Changed text color to black
    fontSize: 40,
    fontWeight: 'bold',
  },
  unit: {
    color: '#666', // Changed text color
    fontSize: 16,
    opacity: 0.7,
  },
  editButton: {
    marginLeft: 'auto',
  },
  editButtonText: {
    color: '#5DCDFE',
    fontSize: 16,
  },
  continueButton: {
    marginBottom: 20,
  },
});
