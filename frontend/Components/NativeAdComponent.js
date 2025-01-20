import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import {
  NativeAd,
  NativeAdView,
  NativeMediaView,
  NativeAsset,
  NativeAssetType,
  TestIds,
} from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
  ? TestIds.NATIVE
  : 'ca-app-pub-2191904332416469/8935709404';

const NativeAdComponent = () => {
  const [nativeAd, setNativeAd] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const loadAd = async () => {
      try {
        const ad = await NativeAd.createForAdRequest(adUnitId);
        setNativeAd(ad);
      } catch (error) {
        console.error('Error loading native ad:', error);
      }
    };

    loadAd();

    return () => {
      nativeAd?.destroy();
    };
  }, []);

  const styles = StyleSheet.create({
    adContainer: {
      marginBottom: 12,
    },
    adCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 2,
      marginHorizontal: 0,
    },
    adContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      height: 84,
    },
    headline: {
      fontWeight: 'bold',
      fontSize: 14,
      marginBottom: 4,
      flex: 1,
    },
    sponsoredText: {
      fontSize: 10,
      color: 'gray',
      marginBottom: 2,
    },
    icon: {
      width: 50,
      height: 50,
      borderRadius: 8,
    },
    mediaView: {
      width: 50,
      height: 50,
      borderRadius: 8,
      marginLeft: 12,
    },
    leftContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    textContent: {
      flex: 1,
      marginLeft: 12,
    }
  });

  if (!nativeAd) {
    return null;
  }

  return (
    <NativeAdView style={styles.adContainer} nativeAd={nativeAd}>
      <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
        <Card style={styles.adCard}>
          <Card.Content style={styles.adContent}>
            {nativeAd.icon && (
              <NativeAsset assetType={NativeAssetType.ICON}>
                <Image source={{ uri: nativeAd.icon.url }} style={styles.icon} />
              </NativeAsset>
            )}
            <View style={styles.textContent}>
              <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <Text style={styles.headline}>{nativeAd.headline}</Text>
              </NativeAsset>
              <Text style={styles.sponsoredText}>Sponsored</Text>
            </View>
            <NativeMediaView style={styles.mediaView} />
          </Card.Content>
        </Card>
      </NativeAsset>
    </NativeAdView>
  );
};

export default NativeAdComponent;