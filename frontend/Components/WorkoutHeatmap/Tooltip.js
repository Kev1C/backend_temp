// frontend/Components/WorkoutHeatmap/Tooltip.js

import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import styles from './WorkoutHeatmap.styles';

const Tooltip = ({ visible, tooltipData, onClose, getCategoryColor, getMetricsText, theme }) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    {tooltipData && (
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPressOut={onClose}
        accessible={false}
      >
        <View style={[styles.tooltip, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.tooltipTitle, { color: theme.colors.text }]}>
            {tooltipData.date}
          </Text>
          <ScrollView>
            {tooltipData.data.map((entry, index) => (
              <View key={index} style={styles.tooltipEntry}>
                <View
                  style={[
                    styles.colorIndicator,
                    { backgroundColor: getCategoryColor(entry.category) },
                  ]}
                />
                <Text style={[styles.tooltipText, { color: theme.colors.text }]}>
                  {entry.category}: {getMetricsText(entry)}
                  {entry.data.PR && (
                    <Text style={styles.prText}> ★ PR</Text>
                  )}
                </Text>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close Details"
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.closeButtonText,
                { color: theme.colors.primary },
              ]}
            >
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )}
  </Modal>
);

export default Tooltip;