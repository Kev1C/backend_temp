// frontend/screens/Home/BodyAnalysisScreen.js

import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';

const BodyAnalysisScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Body Analysis</Text>
      
      {/* Example Section: Body Measurements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Measurements</Text>
        {/* Replace with actual data or form inputs */}
        <Text>Height: 170 cm</Text>
        <Text>Weight: 65 kg</Text>
        <Text>Body Fat: 20%</Text>
      </View>

      {/* Example Section: Progress Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress Over Time</Text>
        {/* Placeholder for a chart library like react-native-chart-kit */}
        <Image
          source={require('../../assets/images/icon.jpg')} // Ensure you have this image or replace with your chart
          style={styles.chart}
          resizeMode="contain"
        />
      </View>

      {/* Example Section: Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        <Text>1. Increase protein intake.</Text>
        <Text>2. Incorporate strength training.</Text>
        <Text>3. Stay hydrated.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    // Ensure content stretches to fill the ScrollView
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
    color: '#4F8EF7',
  },
  section: {
    marginBottom: 25,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5, // For Android shadow
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  chart: {
    width: '100%',
    height: 200,
  },
});

export default BodyAnalysisScreen;