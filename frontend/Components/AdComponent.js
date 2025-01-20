// frontend/Components/AdComponent.js
import React, { useState, useEffect } from 'react';
import { View, Button, Alert, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import {
    RewardedAd,
    RewardedAdEventType,
    TestIds,
    AdEventType,
} from 'react-native-google-mobile-ads';

// Use test IDs during development
//const adUnitId = __DEV__ ? TestIds.REWARDED : (Platform.OS === 'ios' ? 'YOUR_IOS_REWARDED_AD_UNIT_ID' : 'YOUR_ANDROID_REWARDED_AD_UNIT_ID');
const adUnitId = false ? TestIds.REWARDED : (Platform.OS === 'ios' ? 'YOUR_IOS_REWARDED_AD_UNIT_ID' : 'ca-app-pub-2191904332416469/1723427624');
const AdComponent = ({ onAdWatched }) => {
    const { user } = useAuthStore();
    const [adReady, setAdReady] = useState(false);
    const [rewardedAd, setRewardedAd] = useState(null);

    useEffect(() => {
        // Create a new rewarded ad instance
        const rewarded = RewardedAd.createForAdRequest(adUnitId, {
            //requestNonPersonalizedAdsOnly: true,
            keywords: ['fitness', 'health', 'workout'],
        });

        setRewardedAd(rewarded);

        const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
            console.log('Ad loaded');
            setAdReady(true);
        });

        const unsubscribeEarned = rewarded.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            reward => {
                console.log('User earned reward of ', reward);
                // Make sure to call onAdWatched before closing the ad
                if (onAdWatched) {
                    onAdWatched(reward);
                }
            },
        );

        const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
            console.log('User closed ad');
            setAdReady(false);
            // Load a new ad when the current one is closed
            rewarded.load();
        });

        const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
            console.error('Ad error:', error);
            setAdReady(false);
            // Try to load a new ad after error
            setTimeout(() => {
                rewarded.load();
            }, 1000);
        });

        // Initial ad load
        rewarded.load();

        // Cleanup
        return () => {
            unsubscribeLoaded();
            unsubscribeEarned();
            unsubscribeClosed();
            unsubscribeError();
        };
    }, [onAdWatched]);

    const showRewardedAd = async () => {
        if (!rewardedAd || !adReady) {
            Alert.alert('Ad not ready', 'Please wait for the ad to load.');
            return;
        }

        try {
            await rewardedAd.show();
        } catch (error) {
            console.error('Error showing rewarded ad:', error);
            Alert.alert('Error', 'Failed to show ad. Please try again.');
            setAdReady(false);
            // Retry loading after error
            rewardedAd.load();
        }
    };

    return (
        <View style={styles.container}>
            <Button
                title={adReady ? "Watch Ad to Earn Diamonds" : "Loading Ad..."}
                onPress={showRewardedAd}
                disabled={!adReady}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 10,
    },
});

export default AdComponent;