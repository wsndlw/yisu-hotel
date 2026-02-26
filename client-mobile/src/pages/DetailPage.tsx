import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Dimensions, Animated,
  Modal, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScrollView as ScrollViewType } from 'react-native';
import { RouteProp, NavigationProp } from '@react-navigation/native';

// 导入自定义组件
import DateSelectorModal from '../components/Detail-DateSelectorModal';
import GuestSelectorModal from '../components/GuestSelectorModal';
import RoomFilterModal, { FilterOptions } from '../components/RoomFilterModal';

// 导入真实类型和Hooks
import type { HotelDetail, Room, NearbyPoi } from '../types/hotel';
import { useHotelDetail, usePoiList } from '../services/hotel-h5';

// 路由类型定义（补充完整参数）
type RootStackParamList = {
  Search: undefined;
  List: undefined;
  Detail: { id: string; checkInDate?: string; checkOutDate?: string };
};

const cityCodeMap: Record<string, string> = {
  '110100': '北京市',
  '120100': '天津市',
  '310100': '上海市',
  '320100': '南京市',
  '500100': '重庆市',
};

const DetailPage = () => {
  // 定义 ScrollView Ref（用于滚动定位）
  const scrollViewRef = useRef<ScrollViewType>(null);

  // 基础导航和参数（增加默认值，避免undefined）
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Detail'>>();
  const { id: hotelId, checkInDate: routeCheckIn, checkOutDate: routeCheckOut } = route.params || {};

  // 收藏状态 + 动画
  const [isFavorite, setIsFavorite] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;

  // 顶部酒店图片展示
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 相册状态
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);

  // 相册弹窗状态
  const [isAlbumModalVisible, setIsAlbumModalVisible] = useState(false);

  // 日历相关状态（优先用路由参数，兜底默认值 + 统一格式为 YYYY-MM-DD）
  const formatDate = (date: string) => {
    if (!date) return '';
    if (date.includes('-')) return date;
    return date.replace(/\//g, '-');
  };
  const [checkInDate, setCheckInDate] = useState(formatDate(routeCheckIn || ''));
  const [checkOutDate, setCheckOutDate] = useState(formatDate(routeCheckOut || ''));
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  // 记录当前展示的月份，用于日期选择器的初始化
  const [currentViewMonth, setCurrentViewMonth] = useState(() => {
    // 如果有已选择的日期，则使用该日期所在的月份
    if (checkInDate) {
      return new Date(checkInDate);
    }
    return new Date();
  });

  // 入住人数
  const [guestCount, setGuestCount] = useState(1);

  // 入住人数弹窗状态
  const [isGuestModalVisible, setIsGuestModalVisible] = useState(false);

  // 筛选相关状态
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  // 保存筛选后房型的最低价格
  const [minPrice, setMinPrice] = useState<number>(0);

  // 房型列表位置记录
  const [roomSectionY, setRoomSectionY] = useState(0);
  const [currentScrollY, setCurrentScrollY] = useState(0);

  // 调用 React Query Hooks 获取数据库数据
  const {
    data: hotelData,
    loading: hotelLoading,
    error: hotelError,
    refetch: refetchHotel
  } = useHotelDetail(
    hotelId || '',
    checkInDate || '',
    checkOutDate || ''
  );

  // 初始化的房型列表
  useEffect(() => {
    if (hotelData?.rooms && Array.isArray(hotelData.rooms)) {
      setFilteredRooms([...hotelData.rooms]);
    } else {
      setFilteredRooms([]);
    }
    if (hotelId) {
      loadFavoriteStatus();
    }
  }, [hotelData, hotelId]);

  // 从本地存储读取收藏状态
  const loadFavoriteStatus = async () => {
    try {
      const existing = await AsyncStorage.getItem('favoriteHotels');
      const favorites = existing ? JSON.parse(existing) : {};
      setIsFavorite(!!favorites[hotelId]);
    } catch (e) {
      console.error('加载收藏状态失败:', e);
      setIsFavorite(false);
    }
  };

  // 切换收藏状态（带动画）
  const toggleFavorite = async () => {
    if (!hotelId) return;

    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const newState = !isFavorite;
    setIsFavorite(newState);

    try {
      const existing = await AsyncStorage.getItem('favoriteHotels');
      const favorites = existing ? JSON.parse(existing) : {};
      favorites[hotelId] = newState;
      await AsyncStorage.setItem('favoriteHotels', JSON.stringify(favorites));
    } catch (e) {
      console.error('保存收藏状态失败:', e);
    }
  };

  // 渲染星级
  const renderStars = () => {
    const starCount = hotelData?.starLevel ?? 5;
    const validStarCount = Math.max(0, Math.min(5, starCount));

    return (
      <View style={styles.starsRow}>
        {Array.from({ length: validStarCount }).map((_, i) => (
          <FontAwesome key={i} name="star" size={14} color="#ffc107" />
        ))}
      </View>
    );
  };

  // 渲染开业时间
  const renderOpenSince = () => {
    if (!hotelData?.openSince) return null;

    const date = new Date(hotelData?.openSince);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    return (
      <View style={styles.openSinceBadge}>
        <Text style={styles.openSinceText}>{year}年{month}月开业</Text>
      </View>
    );
  };

  // 处理日历选择
  const handleDateSelect = (dateStr: string) => {
    // 更新当前展示的月份为选择的日期所在的月份
    setCurrentViewMonth(new Date(dateStr));

    if (!checkInDate || (checkInDate && checkOutDate)) {
      setCheckInDate(dateStr);
      setCheckOutDate('');
    } else if (checkInDate && !checkOutDate) {
      if (dateStr > checkInDate) {
        setCheckOutDate(dateStr);
        setIsDateModalVisible(false);
      } else {
        setCheckInDate(dateStr);
        // setCheckOutDate(checkInDate);
      }
    }
  };

  // 手动刷新数据
  // const handleRefresh = () => {
  //   refetchHotel();
  // };

  // 适配 Room 类型的筛选逻辑
  const applyRoomFilters = (filters: FilterOptions) => {
    if (!hotelData?.rooms || !Array.isArray(hotelData.rooms)) {
      setFilteredRooms([]);
      return;
    }

    let filtered = hotelData.rooms.filter(room => {
      const maxGuests = Number(room.maxGuests) || 0;
      return maxGuests >= guestCount;
    });

    // 1. 按价格区间筛选
    if (filters.priceRanges && filters.priceRanges.length > 0) {
      filtered = filtered.filter(room => {
        const price = Number(room.price) || 0;
        return filters.priceRanges.some(range => {
          if (range === '¥200以下') return price < 200;
          if (range === '¥200-¥350') return price >= 200 && price < 350;
          if (range === '¥350-¥400') return price >= 350 && price < 400;
          if (range === '¥400-¥500') return price >= 400 && price < 500;
          if (range === '¥500-¥750') return price >= 500 && price < 750;
          if (range === '¥750-¥1000') return price >= 750 && price < 1000;
          if (range === '¥1000-¥1200') return price >= 1000 && price < 1200;
          if (range === '¥1200以上') return price >= 1200;
          return true;
        });
      });
    }

    // 2. 早餐
    if (filters.breakfast) {
      filtered = filtered.filter(room => {
        return !!room.hasBreakfast;
      });
    }

    // 3. 按面积筛选
    if (filters.area) {
      filtered = filtered.filter(room => {
        const area = Number(room.area) || 0;
        if (filters.area === '≥25㎡') return area >= 25;
        if (filters.area === '≥30㎡') return area >= 30;
        return true;
      });
    }

    // 4. 按服务筛选
    if (filters.services === '免费取消') {
      filtered = filtered.filter(room => {
        return room.refundable === true;
      });
    }

    // 5. 按有无窗筛选
    if (filters.window === '有窗') {
      filtered = filtered.filter(room => {
        return room.hasWindow === true;
      });
    }
    setFilteredRooms(filtered);
  };

  // 在入住人数有变化后更新房型列表
  useEffect(() => {
    if (!hotelData?.rooms || !Array.isArray(hotelData.rooms)) {
      setFilteredRooms([]);
      return;
    }

    const filteredByGuests = hotelData.rooms.filter(room => {
      const maxGuests = Number(room.maxGuests) || 0;
      return maxGuests >= guestCount;
    });

    setFilteredRooms(filteredByGuests);
  }, [guestCount, hotelData?.rooms]);

  // 监听 filteredRooms 变化，计算最低价
  useEffect(() => {
    if (!filteredRooms || filteredRooms.length === 0) {
      setMinPrice(0);
      return;
    }

    const prices = filteredRooms.map(room => Number(room.price) || 0);
    const lowestPrice = Math.min(...prices);
    setMinPrice(lowestPrice);
  }, [filteredRooms]);

  // 加载中状态
  if (hotelLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1890ff" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  // 错误状态
  if (hotelError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>加载失败：{hotelError?.message || '网络异常'}</Text>
        <TouchableOpacity
          onPress={() => refetchHotel()}
          style={{ marginTop: 16, backgroundColor: '#1890ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontSize: 16 }}>重新加载</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
          <Text style={{ color: '#666', fontSize: 14 }}>返回上一页</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 数据不存在
  if (checkInDate && checkOutDate && !hotelData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>未找到该酒店信息</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#1890ff', fontSize: 16 }}>返回上一页</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{hotelData?.name || '未知酒店'}</Text>
        <TouchableOpacity style={styles.headerRightBtn} onPress={toggleFavorite}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite ? "#ff4d4f" : "#fff"}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={(event) => {
          const scrollY = event.nativeEvent.contentOffset.y;
          setCurrentScrollY(scrollY);
        }}
        scrollEventThrottle={16}
      >
        {/* 顶部 Banner 轮播 */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.floor(e.nativeEvent.contentOffset.x / Dimensions.get('window').width);
              const maxIndex = (hotelData?.images?.length || 1) - 1;
              const validIndex = Math.max(0, Math.min(index, maxIndex));
              setCurrentImageIndex(validIndex);
            }}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / Dimensions.get('window').width);
              const maxIndex = (hotelData?.images?.length || 1) - 1;
              const validIndex = Math.max(0, Math.min(index, maxIndex));
              setCurrentImageIndex(validIndex);
            }}
          >
            {(hotelData?.images && Array.isArray(hotelData.images) && hotelData.images.length > 0) ? (
              hotelData.images.map((img, index) => (
                <Image key={index} source={{ uri: img || 'https://placeholder.pics/svg/375x220/EEEEEE/666666/暂无图片' }} style={styles.bannerImage} />
              ))
            ) : (
              <Image source={{ uri: 'https://placeholder.pics/svg/375x220/EEEEEE/666666/暂无图片' }} style={styles.bannerImage} />
            )}
          </ScrollView>
          <View style={styles.imageIndicator}>
            <Text style={styles.imageIndicatorText}>
              {currentImageIndex + 1} / {hotelData?.images?.length || 1}
            </Text>
          </View>
          <View style={styles.imageTabs}>
            <Text style={[styles.imageTab, styles.imageTabActive]}>封面</Text>
            <TouchableOpacity onPress={() => setIsAlbumModalVisible(true)} style={styles.albumTab}>
              <Text style={styles.imageTab}>相册 &gt;</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 相册弹窗 */}
        <Modal
          visible={isAlbumModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsAlbumModalVisible(false)}
        >
          <View style={styles.albumModalContainer}>
            <TouchableOpacity
              style={styles.closeAlbumBtn}
              onPress={() => setIsAlbumModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>

            <View style={styles.albumIndicator}>
              <Text style={styles.albumIndicatorText}>
                {currentAlbumIndex + 1} / {hotelData?.images?.length || 1}
              </Text>
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.albumScroll}
              onScroll={(e) => {
                const index = Math.floor(e.nativeEvent.contentOffset.x / Dimensions.get('window').width);
                const maxIndex = (hotelData?.images?.length || 1) - 1;
                const validIndex = Math.max(0, Math.min(index, maxIndex));
                setCurrentAlbumIndex(validIndex);
              }}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / Dimensions.get('window').width);
                const maxIndex = (hotelData?.images?.length || 1) - 1;
                const validIndex = Math.max(0, Math.min(index, maxIndex));
                setCurrentAlbumIndex(validIndex);
              }}
            >
              {(hotelData?.images && Array.isArray(hotelData.images) && hotelData.images.length > 0) ? (
                hotelData.images.map((img, index) => (
                  <Image
                    key={index}
                    source={{ uri: img || 'https://placeholder.pics/svg/375x220/EEEEEE/666666/暂无图片' }}
                    style={styles.albumImage}
                    resizeMode="contain"
                  />
                ))
              ) : (
                <Image source={{ uri: 'https://placeholder.pics/svg/375x220/EEEEEE/666666/暂无图片' }} style={styles.albumImage} resizeMode="contain" />
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* 酒店基础信息区 */}
        <View style={styles.infoCard}>
          <Text style={styles.hotelName}>{hotelData?.name || '未知酒店'}</Text>
          {renderStars()}
          {renderOpenSince()}
          <View style={styles.rankRow}>
            <Ionicons name="trophy" size={16} color="#fa8c16" />
            <Text style={styles.rankText}>{'上海奢华酒店榜 No.1'}</Text>
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreNumber}>{hotelData?.score ?? 4.9}</Text>
              <Text style={styles.scoreLabel}>{(hotelData?.score ?? 4.9) >= 4.8 ? '超棒' : '良好'}</Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.commentCount}>{hotelData?.commentCount ?? hotelData?.favoriteCount ?? 0}条评价</Text>
              <Text style={styles.commentSummary}>"{hotelData?.name || '体验超棒'}"</Text>
            </View>
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <View style={styles.addressInfo}>
              <Text style={styles.addressText}>{hotelData?.address || '暂无地址'}</Text>
              <Text style={styles.cityText}>{cityCodeMap[hotelData?.city || ''] || '未知城市'}</Text>
              <TouchableOpacity style={styles.mapBtn}>
                <Text style={styles.mapBtnText}>地图</Text>
                <Ionicons name="chevron-forward" size={14} color="#1890ff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tagsRow}>
            {(hotelData?.facilities && Array.isArray(hotelData.facilities) && hotelData.facilities.length > 0
              ? hotelData.facilities
              : ['高端酒店', '免费停车', '游泳池']
            ).map((tag, i) => (
              <View key={i} style={[styles.tag, {
                backgroundColor: i % 3 === 0 ? '#e6f7ff' : i % 3 === 1 ? '#fff7e6' : '#f9f0ff'
              }]}>
                <Text style={[styles.tagText, {
                  color: i % 3 === 0 ? '#1890ff' : i % 3 === 1 ? '#fa8c16' : '#722ed1'
                }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 日历+入住人数 Banner */}
        <TouchableOpacity
          style={styles.dateBanner}
          onPress={() => setIsDateModalVisible(true)}
        >
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>入住</Text>
            <Text style={styles.dateValue}>
              {checkInDate ? checkInDate.replace(/-/g, '/') : '选择日期'}
            </Text>
          </View>
          <Ionicons name="swap-horizontal" size={20} color="#1890ff" />
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>离店</Text>
            <Text style={styles.dateValue}>
              {checkOutDate ? checkOutDate.replace(/-/g, '/') : '选择日期'}
            </Text>
          </View>
          <View style={styles.guestBlock}>
            <Text style={styles.guestLabel}>入住人数</Text>
            <TouchableOpacity
              style={styles.guestPicker}
              onPress={() => setIsGuestModalVisible(true)}
            >
              <Text style={styles.guestValue}>{guestCount}人</Text>
              <Ionicons name="chevron-down" size={16} color="#999" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* 筛选栏 */}
        <View style={styles.filterBar}>
          <Text style={styles.filterTag}>含早餐</Text>
          <Text style={styles.filterTag}>可订</Text>
          <Text style={styles.filterTag}>免费取消</Text>
          <Text style={styles.filterTag}>大床房</Text>
          <Text style={styles.filterTag}>双床房</Text>
          <TouchableOpacity
            style={styles.filterMore}
            onPress={() => setIsFilterModalVisible(true)}
          >
            <Text style={styles.filterMoreText}>筛选</Text>
            <Ionicons name="chevron-down" size={14} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 房型价格列表 */}
        <View
          style={styles.roomSection}
          onLayout={(event) => {
            const layout = event.nativeEvent.layout;
            setRoomSectionY(layout.y);
          }}
        >
          <View style={styles.roomSectionHeader}>
            <Text style={styles.sectionTitle}>选择房型</Text>
            <Text style={styles.roomCount}>共 {filteredRooms.length} 个房型</Text>
          </View>

          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <View key={room.id || `room-${Math.random()}`} style={styles.roomCard}>
                <Image
                  source={{ uri: room.coverImage || 'https://placeholder.pics/svg/80x80/EEEEEE/666666/暂无图片' }}
                  style={styles.roomImage}
                />
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName}>{room.title || '未知房型'}</Text>
                  <Text style={styles.roomDesc}>
                    {room.bedType || '未知床型'} ·
                    {room.area ? `${room.area}㎡` : '暂无面积'} ·
                    最多{room.maxGuests}人
                  </Text>
                  <View style={styles.roomTags}>
                    {room.hasBreakfast && <Text style={styles.roomTag}>含早餐</Text>}
                    {room.refundable && <Text style={styles.roomTag}>免费取消</Text>}
                    {room.hasWindow && <Text style={styles.roomTag}>有窗</Text>}
                  </View>
                  <View style={styles.roomFeatures}>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={14} color="#52c41a" />
                      <Text style={styles.featureText}>免费WiFi</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={14} color="#52c41a" />
                      <Text style={styles.featureText}>空调</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.roomPriceBlock}>
                  <Text style={styles.roomPrice}>¥{room.price || 0}</Text>
                  <Text style={styles.priceUnit}>每晚</Text>
                  <Text style={styles.totalPrice}>总计: ¥{room.price || 0}</Text>
                  <TouchableOpacity style={styles.bookBtn}>
                    <Text style={styles.bookBtnText}>立即预订</Text>
                  </TouchableOpacity>
                  <View style={styles.roomActions}>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Text style={styles.actionBtnText}>问酒店</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Text style={styles.actionBtnText}>查看房型</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyRoomContainer}>
              <Text style={styles.emptyRoomText}>暂无可选房型</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 底部最低价格+查看房型按钮 */}
      {currentScrollY < roomSectionY - 400 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomPriceInfo}>
            {filteredRooms.length === 0 ? (
              <Text style={styles.noRoomText}>暂无房型</Text>
            ) : (
              <>
                <Text style={styles.bottomPrice}>
                  ¥{Math.min(...filteredRooms.map(r => Number(r.price) || 0))}
                </Text>
                <Text style={styles.bottomPriceUnit}>起</Text>
              </>
            )}
          </View>
          <TouchableOpacity
            style={styles.bottomBookBtn}
            onPress={() => {
              scrollViewRef.current?.scrollTo({
                y: roomSectionY,
                animated: true,
              });
            }}
          >
            <Text style={styles.bottomBookText}>查看房型</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 日历弹窗组件 */}
      <DateSelectorModal
        visible={isDateModalVisible}
        onClose={() => setIsDateModalVisible(false)}
        startDate={checkInDate}
        endDate={checkOutDate}
        onSelect={handleDateSelect}
        currentMonth={currentViewMonth} // 传递当前查看月份
        onMonthChange={setCurrentViewMonth} // 当用户切换月份时更新
      />

      {/* 入住人数弹窗组件 */}
      <GuestSelectorModal
        visible={isGuestModalVisible}
        onClose={() => setIsGuestModalVisible(false)}
        currentCount={guestCount}
        onSelect={setGuestCount}
      />

      {/* 筛选弹窗组件 */}
      <RoomFilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={applyRoomFilters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4d4f',
    textAlign: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerRightBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: Dimensions.get('window').width,
    height: 220,
    resizeMode: 'cover',
  },
  imageIndicator: {
    position: 'absolute',
    top: 180,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  imageIndicatorText: {
    color: '#fff',
    fontSize: 12,
  },
  imageTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  imageTab: {
    fontSize: 14,
    color: '#666',
    marginRight: 16,
  },
  imageTabActive: {
    color: '#1890ff',
    fontWeight: '600',
  },
  albumTab: {
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
  },
  hotelName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreBadge: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  scoreNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: '#fff',
    fontSize: 12,
  },
  scoreInfo: {
    flex: 1,
  },
  commentCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  commentSummary: {
    fontSize: 13,
    color: '#999',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addressInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapBtnText: {
    fontSize: 14,
    color: '#1890ff',
    marginRight: 4,
  },
  facilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  facilityLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  dateBanner: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateBlock: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  guestBlock: {
    alignItems: 'center',
  },
  guestLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  guestPicker: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guestValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginRight: 4,
  },
  tipBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7e6',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#fa8c16',
    marginLeft: 8,
  },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
  },
  filterTag: {
    fontSize: 13,
    color: '#666',
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  filterMore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterMoreText: {
    fontSize: 13,
    color: '#666',
    marginRight: 4,
  },
  sectionCard: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  nearbyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nearbyInfo: {
    marginLeft: 12,
  },
  nearbyName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  nearbyDesc: {
    fontSize: 13,
    color: '#666',
  },
  roomSection: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
  },
  roomSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomCount: {
    fontSize: 14,
    color: '#999',
  },
  roomCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  roomImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  roomDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  roomTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  roomTag: {
    fontSize: 12,
    color: '#ff4d4f',
    backgroundColor: '#fff1f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 6,
    marginBottom: 6,
  },
  roomFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#52c41a',
    marginLeft: 4,
  },
  roomPriceBlock: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  roomPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4d4f',
  },
  priceUnit: {
    fontSize: 12,
    color: '#999',
  },
  totalPrice: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  bookBtn: {
    backgroundColor: '#ff4d4f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 8,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  roomActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  actionBtnText: {
    fontSize: 12,
    color: '#666',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomPriceInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bottomPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4d4f',
  },
  bottomPriceUnit: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  bottomBookBtn: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  bottomBookText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyRoomContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyRoomText: {
    fontSize: 16,
    color: '#999',
  },
  albumModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeAlbumBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  albumScroll: {
    flex: 1,
    width: '100%',
  },
  albumImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 80,
  },
  albumIndicator: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  albumIndicatorText: {
    color: '#fff',
    fontSize: 14,
  },
  cityText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  openSinceBadge: {
    backgroundColor: '#f6ffed',
    borderWidth: 1,
    borderColor: '#b7eb8f',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  openSinceText: {
    fontSize: 12,
    color: '#52c41a',
  },
  noRoomText: {
    fontSize: 14,
    color: '#999',
  }
});

export default DetailPage;