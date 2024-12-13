// frontend/screens/Progress/ProgressScreen.js

import React, { useEffect, useRef, useState, Suspense, useMemo } from 'react';
import { ScrollView, Alert, TouchableOpacity, RefreshControl, View, ActivityIndicator } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ProgressInput from '../../Components/ProgressInput';
import ProgressChart from '../../Components/ProgressChart';
import CategoryToggle, { PROGRESS_CATEGORIES } from '../../Components/CategoryToggle';
import getStyles from './ProgressScreen.styles';

class ProgressErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Progress Screen Error:', error, errorInfo);
  }

  render() {
    const { styles, theme } = this.props;
    
    if (this.state.hasError) {
      return (
        <View style={styles?.errorContainer || { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <Text variant="bodyLarge" style={{ marginBottom: 16, textAlign: 'center' }}>
            Something went wrong. Please try again later.
          </Text>
          <Button 
            mode="contained"
            onPress={() => this.setState({ hasError: false })}
            style={{ marginTop: 8 }}
          >
            Retry
          </Button>
        </View>
      );
    }
    return this.props.children;
  }
}

const LoadingFallback = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
  </View>
);

const ProgressScreen = ({ navigation }) => {
  const { authToken, user } = useAuthStore();
  const theme = useTheme();
  const styles = getStyles(theme);
  const chartRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(
    PROGRESS_CATEGORIES.map(category => category.key)
  );

  useEffect(() => {
    if (!authToken || !user) {
      Alert.alert(
        'Authentication Required',
        'Please sign in to view your progress.',
        [{ text: 'OK', onPress: () => navigation.navigate('Auth') }],
        { cancelable: false }
      );
    }
  }, [authToken, user, navigation]);

  const handleProgressSubmit = React.useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      if (chartRef.current?.refresh) {
        await chartRef.current.refresh();
      }
    } catch (error) {
      console.error('Error refreshing after submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  const handleToggleCategory = (categoryKey) => {
    setSelectedCategories(prev =>
      prev.includes(categoryKey)
        ? prev.filter(cat => cat !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  const onRefresh = React.useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      if (chartRef.current?.refresh) {
        await chartRef.current.refresh();
      }
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing]);

  if (authToken === null) {
    return (
      <ScrollView contentContainerStyle={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </ScrollView>
    );
  }

  if (!authToken || !user) {
    return (
      <ScrollView contentContainerStyle={styles.noUserContainer}>
        <Text style={styles.noUserText}>No user data available. Please log in.</Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Auth')}
          style={{ marginTop: 20 }}
          accessibilityLabel="Navigate to Auth"
          accessibilityRole="button"
        >
          Go to Auth
        </Button>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      <Suspense fallback={<LoadingFallback />}>
        <ProgressInput token={authToken} onSubmit={handleProgressSubmit} disabled={isSubmitting} />
        <CategoryToggle
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
        />
        <ProgressChart ref={chartRef} token={authToken} selectedCategories={selectedCategories} />
      </Suspense>
    </ScrollView>
  );
};

const ProgressScreenWithErrorBoundary = (props) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  
  return (
    <ProgressErrorBoundary styles={styles} theme={theme}>
      <ProgressScreen {...props} />
    </ProgressErrorBoundary>
  );
};

export default ProgressScreenWithErrorBoundary;