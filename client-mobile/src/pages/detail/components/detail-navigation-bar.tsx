import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  type SharedValue,
  useDerivedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface DetailNavigationBarProps {
  title: string;
  isFavorite: boolean;
  scrollY: SharedValue<number>;
  collapseOffset: number;
  onBack: () => void;
  onToggleFavorite: () => void;
}

export default function DetailNavigationBar({
  title,
  isFavorite,
  scrollY,
  collapseOffset,
  onBack,
  onToggleFavorite,
}: DetailNavigationBarProps) {
  const insets = useSafeAreaInsets();
  const favoriteScale = useSharedValue(1);

  const headerProgress = useDerivedValue(
    () => interpolate(
      scrollY.value,
      [0, collapseOffset],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    [collapseOffset],
  );

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      headerProgress.value,
      [0, 1],
      ['rgba(255,255,255,0)', 'rgba(255,255,255,0.98)'],
    ),
  }));
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(headerProgress.value, [0.58, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{
      translateY: interpolate(headerProgress.value, [0.58, 1], [6, 0], Extrapolation.CLAMP),
    }],
  }));
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      headerProgress.value,
      [0, 1],
      ['rgba(15,23,42,0.46)', 'rgba(248,250,252,0)'],
    ),
  }));
  const lightIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - headerProgress.value,
  }));
  const darkIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerProgress.value,
  }));
  const dividerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerProgress.value,
  }));
  const favoriteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favoriteScale.value }],
  }));

  const handleToggleFavorite = () => {
    favoriteScale.value = withSequence(
      withTiming(1.18, { duration: 100 }),
      withTiming(1, { duration: 100 }),
    );
    onToggleFavorite();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + 6 },
        containerAnimatedStyle,
      ]}
    >
      <Animated.View style={[styles.buttonShell, buttonAnimatedStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="返回上一页"
          hitSlop={8}
          onPress={onBack}
          style={styles.pressable}
        >
          <View style={styles.layeredIcon}>
            <Animated.View style={[styles.iconLayer, lightIconAnimatedStyle]}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Animated.View>
            <Animated.View style={[styles.iconLayer, darkIconAnimatedStyle]}>
              <Ionicons name="arrow-back" size={24} color="#0f172a" />
            </Animated.View>
          </View>
        </Pressable>
      </Animated.View>

      <Animated.Text
        selectable
        numberOfLines={1}
        style={[styles.title, titleAnimatedStyle]}
      >
        {title}
      </Animated.Text>

      <Animated.View
        style={[
          styles.buttonShell,
          buttonAnimatedStyle,
          favoriteAnimatedStyle,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? '取消收藏' : '收藏酒店'}
          hitSlop={8}
          onPress={handleToggleFavorite}
          style={styles.pressable}
        >
          <View style={styles.layeredIcon}>
            <Animated.View style={[styles.iconLayer, lightIconAnimatedStyle]}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? '#ff4d4f' : '#fff'}
              />
            </Animated.View>
            <Animated.View style={[styles.iconLayer, darkIconAnimatedStyle]}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? '#ff4d4f' : '#0f172a'}
              />
            </Animated.View>
          </View>
        </Pressable>
      </Animated.View>

      <Animated.View style={[styles.divider, dividerAnimatedStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  buttonShell: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layeredIcon: {
    width: 24,
    height: 24,
  },
  iconLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  title: {
    flex: 1,
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e2e8f0',
  },
});
