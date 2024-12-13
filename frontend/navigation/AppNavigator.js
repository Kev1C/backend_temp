// frontend/navigation/AppNavigator.js
import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import OnboardingNavigator from './OnboardingNavigator';
import MainNavigator from './MainNavigator';

const AppNavigator = () => {
    const { authToken } = useAuthStore();
    const { isOnboardingComplete } = useOnboardingStore();

    // If user is not authenticated or onboarding is not complete, show onboarding
    if (!authToken || !isOnboardingComplete) {
        return <OnboardingNavigator />;
    }

    // User is authenticated and has completed onboarding
    return <MainNavigator />;
};

export default AppNavigator;