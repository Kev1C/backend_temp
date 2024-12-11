import { useCallback } from 'react';
import { Alert } from 'react-native';
import { ErrorHandler } from '../types/hooks';

export const useErrorHandler = (): ErrorHandler => {
  return useCallback((error: any) => {
    const message = error?.response?.data?.message 
      || error?.message 
      || 'An unexpected error occurred';
      
    Alert.alert('Error', message);
    console.error('Error handled:', error);
  }, []);
};

export default useErrorHandler;
