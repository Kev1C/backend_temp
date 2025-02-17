// frontend/utils/adUtils.js
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';

export const initRewardedAd = (adUnitId, keywords, callbacks) => {
  const adInstance = RewardedAd.createForAdRequest(adUnitId, { keywords });
  const listeners = [];

  listeners.push(
    adInstance.addAdEventListener(RewardedAdEventType.LOADED, () => {
      callbacks.onLoaded && callbacks.onLoaded();
    })
  );
  listeners.push(
    adInstance.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      callbacks.onEarnedReward && callbacks.onEarnedReward(reward);
    })
  );
  listeners.push(
    adInstance.addAdEventListener(AdEventType.CLOSED, () => {
      callbacks.onClosed && callbacks.onClosed();
      // Reload after closed
      adInstance.load();
    })
  );
  listeners.push(
    adInstance.addAdEventListener(AdEventType.ERROR, (error) => {
      callbacks.onError && callbacks.onError(error);
      // Reload after error with delay
      setTimeout(() => adInstance.load(), 1000);
    })
  );

  adInstance.load();
  return {
    adInstance,
    unsubscribe: () => listeners.forEach((unsub) => unsub()),
  };
};