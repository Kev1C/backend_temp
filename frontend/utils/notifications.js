// frontend/utils/notifications.js

import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import { Alert, Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async () => {
  const { status } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
  let finalStatus = status;

  if (status !== 'granted') {
    const { status: newStatus } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    finalStatus = newStatus;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Permission Denied', 'Cannot schedule notifications without permission.');
    return false;
  }

  return true;
};

/**
 * Schedule a notification
 * @param {String} title - Notification title
 * @param {String} body - Notification body
 * @param {Date} trigger - When to trigger the notification
 */
export const scheduleNotification = async (title, body, trigger) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger,
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

/**
 * Cancel all notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
};