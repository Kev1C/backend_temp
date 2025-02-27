// frontend/stores/adStore.js
import {create} from 'zustand';
import { Platform } from 'react-native';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useDiamondStore } from './diamondStore';
import { initRewardedAd } from '../utils/adUtils';

export const useAdStore = create((set) => {
  // Define ad unit ids for home and settings
  const homeAdUnitId =
    false
      ? TestIds.REWARDED
      : Platform.OS === 'ios'
      ? 'YOUR_IOS_REWARDED_AD_UNIT_ID_FOR_HOME'
      : process.env.GOOGLE_ADMOB_ANDROID_REWARDED_HomeScreen;

  const settingsAdUnitId =
      false
        ? TestIds.REWARDED
        : Platform.OS === 'ios'
        ? 'YOUR_IOS_REWARDED_AD_UNIT_ID_FOR_SETTINGS'
        : process.env.GOOGLE_ADMOB_ANDROID_REWARDED_SettingScreen;

  return {
    homeRewardedAd: null,
    homeAdReady: false,
    homeReward: 45, // Default reward amount for home ad
    settingsRewardedAd: null,
    settingsAdReady: false,
    settingsReward: 45, // Default reward amount for settings ad

    // Initialization function for ads
    initializeAds: () => {
      // Home Screen Ad
      const homeKeywords = ['fitness', 'health', 'workout', 'exercise'];
      const homeAd = initRewardedAd(
        homeAdUnitId,
        homeKeywords,
        {
          onLoaded: () => set({ homeAdReady: true }),
          onClosed: () => set({ homeAdReady: false }),
          onError: (error) => {
            console.error('Home ad error:', error);
            set({ homeAdReady: false });
          },
          onEarnedReward: (reward) => {
            // Set the reward value from AdMob or use default 75
            const diamondReward = reward?.amount || 45;
            // Update the store reward value so UI shows the right amount next time
            set({ homeReward: diamondReward });
            // Award diamonds
            useDiamondStore.getState().addDiamonds(diamondReward);
          }
        }
      );
      set({ homeRewardedAd: homeAd.adInstance });

      // Settings Screen Ad
      const settingsKeywords = [
        'fitness',
        'health',
        'workout',
        'exercise',
        'bodybuilding',
        'muscle',
      ];
      const settingsAd = initRewardedAd(
        settingsAdUnitId,
        settingsKeywords,
        {
          onLoaded: () => set({ settingsAdReady: true }),
          onClosed: () => set({ settingsAdReady: false }),
          onError: (error) => {
            console.error('Settings ad error:', error);
            set({ settingsAdReady: false });
          },
          onEarnedReward: (reward) => {
            const diamondReward = reward?.amount || 45;
            set({ settingsReward: diamondReward });
            useDiamondStore.getState().addDiamonds(diamondReward);
          }
        }
      );
      set({ settingsRewardedAd: settingsAd.adInstance });
    },

    // Function to show home ad
    showHomeRewardedAd: async () => {
      const { homeRewardedAd, homeAdReady } = useAdStore.getState();
      if (!homeRewardedAd || !homeAdReady) {
        console.warn('Home ad not ready');
        return;
      }
      try {
        await homeRewardedAd.show();
      } catch (error) {
        console.error('Error displaying home ad:', error);
      }
    },

    // Function to show settings ad
    showSettingsRewardedAd: async () => {
      const { settingsRewardedAd, settingsAdReady } = useAdStore.getState();
      if (!settingsRewardedAd || !settingsAdReady) {
        console.warn('Settings ad not ready');
        return;
      }
      try {
        await settingsRewardedAd.show();
      } catch (error) {
        console.error('Error displaying settings ad:', error);
      }
    },
  };
});
