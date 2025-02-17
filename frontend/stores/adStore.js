// frontend/stores/adStore.js
import {create} from 'zustand';
import { Platform } from 'react-native';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useDiamondStore } from './diamondStore'; // Import diamond store
import { initRewardedAd } from '../utils/adUtils'; // Import the utility

export const useAdStore = create((set) => {
  // Initialize the rewarded ad instances for home and settings screens
  const homeAdUnitId =
    //__DEV__
    false
      ? TestIds.REWARDED
      : Platform.OS === 'ios'
      ? 'YOUR_IOS_REWARDED_AD_UNIT_ID_FOR_HOME'
      : process.env.GOOGLE_ADMOB_ANDROID_REWARDED_HomeScreen;

    const settingsAdUnitId =
    //__DEV__
      false
        ? TestIds.REWARDED
        : Platform.OS === 'ios'
        ? 'YOUR_IOS_REWARDED_AD_UNIT_ID_FOR_SETTINGS'
        : process.env.GOOGLE_ADMOB_ANDROID_REWARDED_SettingScreen;

  // Create the store and return state and actions
  return {
    homeRewardedAd: null,
    homeAdReady: false,
    settingsRewardedAd: null,
    settingsAdReady: false,

    // Initialization function to be called once (e.g., at app startup)
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
            const diamondReward = reward?.amount || 75;
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
            const diamondReward = reward?.amount || 75;
            useDiamondStore.getState().addDiamonds(diamondReward);
          }
        }
      );
      set({ settingsRewardedAd: settingsAd.adInstance });
    },

    // Functions to show the preloaded ads
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
