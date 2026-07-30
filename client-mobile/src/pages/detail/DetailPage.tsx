import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type NavigationProp,
  type RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import DateSelectorModal from '../../components/Detail-DateSelectorModal';
import GuestSelectorModal from '../../components/GuestSelectorModal';
import RoomFilterModal, { type FilterOptions } from '../../components/RoomFilterModal';
import type { RootStackParamList } from '../../navigation/navigationRef';
import { requireAuth } from '../../navigation/requireAuth';
import { useHotelDetail } from '../../services/hotel-h5';
import { useBookingStore } from '../../store/bookingStore';
import type { Room, RoomRatePlan } from '../../types/hotel';
import BookingConditionBar from './components/booking-condition-bar';
import DetailBottomBar from './components/detail-bottom-bar';
import DetailNavigationBar from './components/detail-navigation-bar';
import HotelHero from './components/hotel-hero';
import HotelSummaryCard from './components/hotel-summary-card';
import RoomFilterBar from './components/room-filter-bar';
import RoomSection from './components/room-section';
import styles from './DetailPage.styles';

const cityCodeMap: Record<string, string> = {
  '110100': '北京市',
  '120100': '天津市',
  '310100': '上海市',
  '320100': '南京市',
  '500100': '重庆市',
};

const EMPTY_FILTERS: FilterOptions = {
  priceRanges: [],
  breakfast: undefined,
  area: undefined,
  services: undefined,
  bedType: [],
  people: undefined,
  window: undefined,
};

function normalizeDate(value?: string) {
  if (!value) return '';
  const match = value.match(/\d{4}[-/]\d{2}[-/]\d{2}/);
  return match ? match[0].replace(/\//g, '-') : '';
}

function calculateNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
  const checkInTime = new Date(`${checkIn}T00:00:00.000Z`).getTime();
  const checkOutTime = new Date(`${checkOut}T00:00:00.000Z`).getTime();
  return Math.max(0, Math.round((checkOutTime - checkInTime) / 86400000));
}

function roomMatchesPriceRange(room: Room, range: string) {
  const price = Number(room.price);
  if (!Number.isFinite(price)) return false;
  if (range === '¥200以下') return price < 200;
  if (range === '¥200-¥350') return price >= 200 && price < 350;
  if (range === '¥350-¥400') return price >= 350 && price < 400;
  if (range === '¥400-¥500') return price >= 400 && price < 500;
  if (range === '¥500-¥750') return price >= 500 && price < 750;
  if (range === '¥750-¥1000') return price >= 750 && price < 1000;
  if (range === '¥1000-¥1200') return price >= 1000 && price < 1200;
  if (range === '¥1200以上') return price >= 1200;
  return true;
}

function filterRooms(rooms: Room[], guestCount: number, filters: FilterOptions) {
  return rooms.filter((room) => {
    if (room.maxGuests != null && Number(room.maxGuests) < guestCount) return false;
    if (
      filters.priceRanges.length > 0
      && !filters.priceRanges.some((range) => roomMatchesPriceRange(room, range))
    ) {
      return false;
    }
    if (filters.breakfast && !room.hasBreakfast) return false;
    if (filters.area === '≥25㎡' && Number(room.area || 0) < 25) return false;
    if (filters.area === '≥30㎡' && Number(room.area || 0) < 30) return false;
    if (filters.services === '免费取消' && room.refundable !== true) return false;
    if (filters.window === '有窗' && room.hasWindow !== true) return false;
    if (
      filters.bedType.length > 0
      && !filters.bedType.some((bedType) => room.bedType?.includes(bedType))
    ) {
      return false;
    }
    return true;
  });
}

function getActiveFilterLabels(filters: FilterOptions) {
  return [
    ...filters.priceRanges,
    filters.breakfast,
    filters.area,
    filters.services,
    filters.window,
    ...filters.bedType,
  ].filter((label): label is string => Boolean(label));
}

export default function DetailPage() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<React.ElementRef<typeof Animated.ScrollView>>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Detail'>>();
  const {
    id: hotelId,
    checkInDate: routeCheckIn,
    checkOutDate: routeCheckOut,
  } = route.params || {};
  const storedCheckIn = useBookingStore((state) => state.checkIn);
  const storedCheckOut = useBookingStore((state) => state.checkOut);
  const storedGuestCount = useBookingStore((state) => state.guestCount);
  const updateBooking = useBookingStore((state) => state.updateBooking);
  const initialCheckInDate = normalizeDate(routeCheckIn || storedCheckIn);
  const initialCheckOutDate = normalizeDate(routeCheckOut || storedCheckOut);

  const [checkInDate, setCheckInDate] = useState(initialCheckInDate);
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOutDate);
  const [guestCount, setGuestCount] = useState(Math.max(1, storedGuestCount || 1));
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [isGuestModalVisible, setIsGuestModalVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>(EMPTY_FILTERS);
  const [isFavorite, setIsFavorite] = useState(false);
  const [roomSectionY, setRoomSectionY] = useState(0);
  const [bookingControlsHeight, setBookingControlsHeight] = useState(0);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const scrollY = useSharedValue(0);
  const collapsedState = useSharedValue(false);
  const heroHeight = Math.min(Math.max(width * 0.68, 250), 340);
  const navigationHeight = insets.top + 54;
  const collapseOffset = Math.max(heroHeight - navigationHeight - 24, 120);
  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        scrollY.value = event.contentOffset.y;
        const nextCollapsed = event.contentOffset.y >= collapseOffset * 0.72;
        if (nextCollapsed !== collapsedState.value) {
          collapsedState.value = nextCollapsed;
          runOnJS(setIsHeaderCollapsed)(nextCollapsed);
        }
      },
    },
    [collapseOffset],
  );

  const {
    data: hotelData,
    loading: hotelLoading,
    error: hotelError,
    refetch: refetchHotel,
  } = useHotelDetail(hotelId || '', checkInDate, checkOutDate);

  const filteredRooms = useMemo(
    () => filterRooms(hotelData?.rooms || [], guestCount, activeFilters),
    [activeFilters, guestCount, hotelData?.rooms],
  );
  const activeFilterLabels = useMemo(
    () => getActiveFilterLabels(activeFilters),
    [activeFilters],
  );
  const nights = calculateNights(checkInDate, checkOutDate);
  const minPrice = useMemo(() => {
    const prices = filteredRooms
      .filter((room) => room.stock == null || room.stock > 0)
      .map((room) => Number(room.price))
      .filter((price) => Number.isFinite(price) && price >= 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  }, [filteredRooms]);

  useEffect(() => {
    let active = true;

    async function loadFavoriteStatus() {
      if (!hotelId) return;
      try {
        const existing = await AsyncStorage.getItem('favoriteHotels');
        const favorites = existing ? JSON.parse(existing) : {};
        if (active) setIsFavorite(Boolean(favorites[hotelId]));
      } catch (error) {
        console.error('加载收藏状态失败:', error);
        if (active) setIsFavorite(false);
      }
    }

    void loadFavoriteStatus();
    return () => {
      active = false;
    };
  }, [hotelId]);

  const toggleFavorite = async () => {
    if (!hotelId) return;

    const nextFavoriteState = !isFavorite;
    setIsFavorite(nextFavoriteState);

    try {
      const existing = await AsyncStorage.getItem('favoriteHotels');
      const favorites = existing ? JSON.parse(existing) : {};
      favorites[hotelId] = nextFavoriteState;
      await AsyncStorage.setItem('favoriteHotels', JSON.stringify(favorites));
    } catch (error) {
      console.error('保存收藏状态失败:', error);
      setIsFavorite(!nextFavoriteState);
    }
  };

  const handleDateConfirm = (nextCheckInDate: string, nextCheckOutDate: string) => {
    setCheckInDate(nextCheckInDate);
    setCheckOutDate(nextCheckOutDate);
    updateBooking({
      checkIn: nextCheckInDate,
      checkOut: nextCheckOutDate,
      selectedRoom: null,
    });
    setIsDateModalVisible(false);
  };

  const handleBookNow = (room: Room, ratePlan: RoomRatePlan) => {
    if (!checkInDate || !checkOutDate) {
      Alert.alert('请选择日期', '请先选择入住日期和离店日期');
      setIsDateModalVisible(true);
      return;
    }
    if (checkInDate >= checkOutDate) {
      Alert.alert('日期有误', '离店日期必须晚于入住日期');
      setIsDateModalVisible(true);
      return;
    }
    if (!hotelData?.id || !room.id) {
      Alert.alert('无法预订', '酒店或房型信息不完整，请刷新后重试');
      return;
    }
    if (room.stock != null && room.stock <= 0) {
      Alert.alert('房型已满', '该房型在所选日期暂无库存，请选择其他房型');
      return;
    }
    if (room.maxGuests != null && guestCount > room.maxGuests) {
      Alert.alert('入住人数超限', `该房型最多可入住 ${room.maxGuests} 人`);
      return;
    }

    if (ratePlan.roomTypeId !== room.id) {
      Alert.alert('报价有误', '房型与价格方案不匹配，请刷新后重试');
      return;
    }

    const roomPrice = Number(ratePlan.price);
    if (!Number.isFinite(roomPrice) || roomPrice < 0) {
      Alert.alert('价格有误', '暂时无法获取该房型价格，请稍后重试');
      return;
    }

    updateBooking({
      city: {
        code: hotelData.city || '',
        name: cityCodeMap[hotelData.city || ''] || hotelData.city || '',
      },
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guestCount,
      selectedHotel: {
        id: hotelData.id,
        name: hotelData.name,
        address: hotelData.address,
        imageUrl: hotelData.images?.[0] || null,
      },
      selectedRoom: {
        id: room.id,
        name: room.title,
        price: roomPrice,
        maxGuests: room.maxGuests,
        ratePlan: {
          id: ratePlan.id,
          name: ratePlan.name,
          hasBreakfast: ratePlan.hasBreakfast,
          refundable: ratePlan.refundable,
        },
        priceSnapshot: {
          currency: 'CNY',
          nightlyPrice: roomPrice,
          nights,
          totalPrice: roomPrice * nights,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guestCount,
          capturedAt: new Date().toISOString(),
        },
      },
    });

    if (!requireAuth(navigation, 'BookingConfirm')) return;
    navigation.navigate('BookingConfirm');
  };

  const stateContainerStyle = [
    styles.stateContainer,
    {
      paddingTop: insets.top + 24,
      paddingBottom: insets.bottom + 24,
    },
  ];

  if (hotelLoading) {
    return (
      <View style={stateContainerStyle}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#1677ff" />
        <Text style={styles.stateText}>酒店信息加载中…</Text>
      </View>
    );
  }

  if (hotelError) {
    return (
      <View style={stateContainerStyle}>
        <StatusBar barStyle="dark-content" />
        <Text selectable style={styles.errorText}>
          加载失败：{hotelError.message || '网络异常'}
        </Text>
        <Pressable onPress={() => refetchHotel()} style={styles.primaryStateButton}>
          <Text style={styles.primaryStateButtonText}>重新加载</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} style={styles.secondaryStateButton}>
          <Text style={styles.secondaryStateButtonText}>返回上一页</Text>
        </Pressable>
      </View>
    );
  }

  if (!hotelData) {
    return (
      <View style={stateContainerStyle}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.stateText}>未找到该酒店信息</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.primaryStateButton}>
          <Text style={styles.primaryStateButtonText}>返回上一页</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isHeaderCollapsed ? 'dark-content' : 'light-content'}
        translucent
        backgroundColor="transparent"
      />

      <Animated.ScrollView
        ref={scrollViewRef}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: 104 + insets.bottom }}
        stickyHeaderIndices={[2]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <HotelHero
          images={hotelData.images}
          heroHeight={heroHeight}
          scrollY={scrollY}
        />
        <HotelSummaryCard
          hotel={hotelData}
          cityName={cityCodeMap[hotelData.city || ''] || hotelData.city || undefined}
        />
        <View
          collapsable={false}
          style={[
            styles.stickyHeader,
            {
              marginTop: -navigationHeight,
              paddingTop: navigationHeight,
            },
          ]}
        >
          <View
            style={styles.controlsSurface}
            onLayout={(event) => setBookingControlsHeight(event.nativeEvent.layout.height)}
          >
            <BookingConditionBar
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              guestCount={guestCount}
              onDatesPress={() => setIsDateModalVisible(true)}
              onGuestsPress={() => setIsGuestModalVisible(true)}
            />
            <RoomFilterBar
              activeLabels={activeFilterLabels}
              onOpenFilters={() => setIsFilterModalVisible(true)}
            />
          </View>
        </View>
        <RoomSection
          rooms={filteredRooms}
          nights={nights}
          onBook={handleBookNow}
          onLayout={(event) => setRoomSectionY(event.nativeEvent.layout.y)}
        />
      </Animated.ScrollView>

      <DetailNavigationBar
        title={hotelData.name}
        isFavorite={isFavorite}
        scrollY={scrollY}
        collapseOffset={collapseOffset}
        onBack={() => navigation.goBack()}
        onToggleFavorite={() => void toggleFavorite()}
      />

      <DetailBottomBar
        visible
        minPrice={minPrice}
        onViewRooms={() => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(
              roomSectionY - navigationHeight - bookingControlsHeight - 8,
              0,
            ),
            animated: true,
          });
        }}
      />

      <DateSelectorModal
        visible={isDateModalVisible}
        hotelId={hotelId || ''}
        onClose={() => setIsDateModalVisible(false)}
        startDate={checkInDate}
        endDate={checkOutDate}
        onConfirm={handleDateConfirm}
      />

      <GuestSelectorModal
        visible={isGuestModalVisible}
        onClose={() => setIsGuestModalVisible(false)}
        currentCount={guestCount}
        onSelect={setGuestCount}
      />

      <RoomFilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={setActiveFilters}
      />
    </View>
  );
}
