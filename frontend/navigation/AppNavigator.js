// frontend/navigation/AppNavigator.js
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { OnboardingContext } from '../context/OnboardingContext';
import OnboardingNavigator from './OnboardingNavigator';
import MainNavigator from './MainNavigator';

const AppNavigator = () => {
    const { authToken } = useContext(AuthContext);
    const { onboardingData } = useContext(OnboardingContext);

    // If user is not authenticated or onboarding is not complete, show onboarding
    if (!authToken || !onboardingData.isOnboardingComplete) {
        return <OnboardingNavigator />;
    }

    // User is authenticated and has completed onboarding
    return <MainNavigator />;
};

export default AppNavigator;