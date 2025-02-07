import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 80, // Adding bottom padding to content
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'absolute', // Position footer absolutely
    bottom: 0, // Align to bottom
    left: 0,
    right: 0,
    marginBottom: 20, // Move up from bottom
  },
});
