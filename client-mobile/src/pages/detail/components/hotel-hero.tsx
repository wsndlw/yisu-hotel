import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

interface HotelHeroProps {
  images?: string[] | null;
  heroHeight: number;
  scrollY: SharedValue<number>;
}

export default function HotelHero({ images, heroHeight, scrollY }: HotelHeroProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);
  const [albumVisible, setAlbumVisible] = useState(false);
  const validImages = useMemo(
    () => (images || []).filter((image): image is string => Boolean(image)),
    [images],
  );
  const imageCount = Math.max(validImages.length, 1);
  const mediaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, heroHeight],
          [0, heroHeight * 0.26],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          scrollY.value,
          [-heroHeight, 0],
          [1.32, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }), [heroHeight]);

  useEffect(() => {
    setCurrentImageIndex((index) => Math.min(index, imageCount - 1));
    setCurrentAlbumIndex((index) => Math.min(index, imageCount - 1));
    if (validImages.length === 0) setAlbumVisible(false);
  }, [imageCount, validImages.length]);

  const getIndex = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    return Math.max(0, Math.min(nextIndex, imageCount - 1));
  };

  const renderEmptyImage = (containerStyle: StyleProp<ViewStyle>) => (
    <View style={[styles.emptyImage, containerStyle]}>
      <Ionicons name="image-outline" size={40} color="#94a3b8" />
      <Text style={styles.emptyImageText}>暂无酒店图片</Text>
    </View>
  );

  return (
    <View style={[styles.container, { height: heroHeight }]}>
      <Animated.View
        style={[
          styles.media,
          { width, height: heroHeight },
          mediaAnimatedStyle,
        ]}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => setCurrentImageIndex(getIndex(event))}
          onMomentumScrollEnd={(event) => setCurrentImageIndex(getIndex(event))}
          scrollEventThrottle={16}
        >
          {validImages.length > 0
            ? validImages.map((image, index) => (
              <Image
                key={`${image}-${index}`}
                source={{ uri: image }}
                style={{ width, height: heroHeight }}
                resizeMode="cover"
              />
            ))
            : renderEmptyImage({ width, height: heroHeight })}
        </ScrollView>
      </Animated.View>

      <View pointerEvents="none" style={styles.topScrim} />

      <View style={styles.imageIndicator}>
        <Text style={styles.imageIndicatorText}>
          {currentImageIndex + 1} / {imageCount}
        </Text>
      </View>

      <View style={styles.imageTabs}>
        <View style={styles.activeTab}>
          <Text style={styles.activeTabText}>封面</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="查看酒店相册"
          disabled={validImages.length === 0}
          onPress={() => setAlbumVisible(true)}
          style={({ pressed }) => [
            styles.albumTab,
            validImages.length === 0 && styles.disabledTab,
            pressed && styles.pressedTab,
          ]}
        >
          <Text style={styles.albumTabText}>相册</Text>
          <Ionicons name="chevron-forward" size={15} color="#fff" />
        </Pressable>
      </View>

      <Modal
        visible={albumVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setAlbumVisible(false)}
      >
        <View
          style={[
            styles.albumModal,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="关闭相册"
            hitSlop={8}
            onPress={() => setAlbumVisible(false)}
            style={[styles.closeButton, { top: insets.top + 8 }]}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => setCurrentAlbumIndex(getIndex(event))}
            onMomentumScrollEnd={(event) => setCurrentAlbumIndex(getIndex(event))}
            scrollEventThrottle={16}
          >
            {validImages.map((image, index) => (
              <View
                key={`album-${image}-${index}`}
                style={{ width, height: Math.max(height - insets.top - insets.bottom, 1) }}
              >
                <Image source={{ uri: image }} style={styles.albumImage} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>

          <View style={[styles.albumIndicator, { bottom: insets.bottom + 24 }]}>
            <Text style={styles.albumIndicatorText}>
              {currentAlbumIndex + 1} / {imageCount}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#cbd5e1',
  },
  media: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 116,
    backgroundColor: 'rgba(15,23,42,0.18)',
  },
  emptyImage: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e2e8f0',
  },
  emptyImageText: {
    color: '#64748b',
    fontSize: 14,
  },
  imageIndicator: {
    position: 'absolute',
    right: 16,
    bottom: 64,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(15,23,42,0.68)',
  },
  imageIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  imageTabs: {
    position: 'absolute',
    left: 16,
    bottom: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 4,
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.68)',
  },
  activeTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  activeTabText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
  },
  albumTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  albumTabText: {
    color: '#fff',
    fontSize: 13,
  },
  disabledTab: {
    opacity: 0.4,
  },
  pressedTab: {
    opacity: 0.65,
  },
  albumModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
  },
  closeButton: {
    position: 'absolute',
    right: 18,
    zIndex: 2,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(15,23,42,0.7)',
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  albumIndicator: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 13,
    backgroundColor: 'rgba(15,23,42,0.72)',
  },
  albumIndicatorText: {
    color: '#fff',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
});
