// frontend/Components/AdComponent.js
import React, { useState, useEffect } from 'react';
import { View, Button, Alert, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import {
    RewardedAd,
    RewardedAdEventType,
    TestIds,
    AdEventType,
    InterstitialAd
} from 'react-native-google-mobile-ads';
import { GOOGLE_ADMOB_ANDROID_REWARDED, GOOGLE_ADMOB_IOS_REWARDED } from '@env';

const adUnitId = Platform.OS === 'ios' ? GOOGLE_ADMOB_IOS_REWARDED : GOOGLE_ADMOB_ANDROID_REWARDED;

const AdComponent = ({ onAdWatched }) => {
    const { user } = useAuthStore();
    const [adReady, setAdReady] = useState(false);
    const [rewarded, setRewarded] = useState(null);

    useEffect(() => {
        const rewarded = RewardedAd.createForAdRequest(adUnitId, {
            requestNonPersonalizedAdsOnly: true,
        });

        const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
            setAdReady(true);
        });
        const unsubscribeEarned = rewarded.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            reward => {
                console.log('User earned reward of ', reward);
                setRewarded(reward);
                onAdWatched(reward)
            },
        );
        const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
            console.log('User closed ad');
            setAdReady(false);
            rewarded.load();
        });
        // Start loading the rewarded ad straight away
        rewarded.load();
        // Unsubscribe from events on unmount
        return () => {
            unsubscribeLoaded();
            unsubscribeEarned();
            unsubscribeClosed();
        };
    }, []);

    const showRewardedAd = async () => {
        if (adReady) {
            try {
                await rewarded.show();
            } catch (error) {
                console.error('Error showing rewarded ad:', error);
                Alert.alert('Error', 'Failed to show ad. Please try again.');
            }
        } else {
            Alert.alert('Ad not ready', 'Please wait for the ad to load.');
        }
    };

    return (
        <View style={styles.container}>
            <Button
                title="Watch Ad to Earn Diamonds"
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