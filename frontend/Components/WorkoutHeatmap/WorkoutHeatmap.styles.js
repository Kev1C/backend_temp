// frontend/Components/WorkoutHeatmap.styles.js

import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 7; // Days of the week
const CELL_MARGIN = 4;
const SCREEN_PADDING = 40; // Same as in WorkoutHeatmap.js

// Calculate CELL_SIZE based on screen width
const CELL_SIZE = (width - SCREEN_PADDING - (NUM_COLUMNS - 1) * CELL_MARGIN) / NUM_COLUMNS;

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    alignItems: 'center',
    paddingHorizontal: 20, // Prevent heatmap from touching screen edges
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  navButton: {
    fontSize: 24,
    marginHorizontal: 20,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'center',
    flexWrap: 'wrap', // Allow wrapping on smaller screens
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 5,
    marginVertical: 5, // Added vertical margin for better spacing when wrapping
  },
  categoryButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pickerLabel: {
    marginRight: 10,
    fontSize: 16,
  },
  picker: {
    height: 50,
    width: 150,
  },
  heatmapContainer: {
    alignItems: 'center',
  },
  heatmap: {
    overflow: 'visible',
  },
  tooltip: {
    width: '80%',
    maxHeight: '80%',
    padding: 20,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  tooltipEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  tooltipText: {
    fontSize: 14,
    flex: 1,
    flexWrap: 'wrap',
  },
  prText: {
    color: 'gold',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingIndicator: {
    marginTop: 20,
  },
});

export default styles;