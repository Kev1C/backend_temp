// useErrorHandler.js
import { Alert } from 'react-native';

export const useErrorHandler = () => {
  const handleError = (message, title = 'Error') => {
    console.error(message);
    Alert.alert(title, message);
  };

  return handleError;
};