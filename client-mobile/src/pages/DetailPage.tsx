import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Dimensions, Animated
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScrollView as ScrollViewType } from 'react-native';

// 导入自定义组件
import DateSelectorModal from '../components/DateSelectorModal';
import GuestSelectorModal from '../components/GuestSelectorModal';
import RoomFilterModal, { FilterOptions } from '../components/RoomFilterModal';

// 导入真实类型和Hooks
import type { HotelDetail, Room, NearbyPoi } from '../types/hotel';
import { useHotelDetail, usePoiList } from '../services/hotel-h5';


// 路由类型定义（补充完整参数）
type RootStackParamList = {
  Search: undefined;
  List: { checkInDate?: string; checkOutDate?: string; city?: string };
  Detail: { hotelId: string; checkInDate?: string; checkOutDate?: string };
};

const DetailPage = () => {
  // 1. 定义 ScrollView Ref（用于滚动定位）
  const scrollViewRef = useRef<ScrollViewType>(null);

  // 2. 基础导航和参数（增加默认值，避免undefined）
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { hotelId, checkInDate: routeCheckIn, checkOutDate: routeCheckOut } = route.params || {};

  console.log('【DetailPage 接收的路由参数】', {
    hotelId: hotelId,
    原始params: route.params, // 打印完整参数对象
    hotelId是否为空: !hotelId // 快速判断是否有值
  });

  // 3. 核心状态（优先使用路由传递的日期）
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [guestCount, setGuestCount] = useState(2);
  const [roomSectionY, setRoomSectionY] = useState(0);
  const [currentScrollY, setCurrentScrollY] = useState(0);

  // 日历相关状态（优先用路由参数，兜底默认值 + 统一格式为 YYYY-MM-DD）
  const formatDate = (date: string) => date?.replace(/\//g, '-') || '2026-02-19';
  const [checkInDate, setCheckInDate] = useState(formatDate(routeCheckIn));
  const [checkOutDate, setCheckOutDate] = useState(formatDate(routeCheckOut));
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);

  // 入住人数弹窗状态
  const [isGuestModalVisible, setIsGuestModalVisible] = useState(false);

  // 收藏状态 + 动画
  const [isFavorite, setIsFavorite] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;

  // 筛选相关状态
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);

    // 调用 React Query Hooks 获取数据库数据（适配三层返回结构）
    const { 
      data: hotel,  // 这里的 hotel 已经是 result.data（即 HotelDetail 类型）
      loading: hotelLoading, 
      error: hotelError, 
      refetch: refetchHotel 
    } = useHotelDetail(
      hotelId || '', // 空值保护
      checkInDate,
      checkOutDate
    );

  // 获取附近POI列表（从酒店数据取城市，兜底上海）
  const { data: poiList } = usePoiList({
    city: hotel?.city || route.params?.city || '上海',
    limit: 10,
  });

  // 初始化筛选后的房型列表（适配三层结构 + 空值判断）
  useEffect(() => {
    if (hotel?.rooms && Array.isArray(hotel.rooms)) {
      setFilteredRooms([...hotel.rooms]); // 深拷贝避免原数据污染
    } else {
      setFilteredRooms([]); // 无数据时置空
    }
    // 仅当hotelId有效时加载收藏状态
    if (hotelId) {
      loadFavoriteStatus();
    }
  }, [hotel, hotelId]);

  useEffect(() => {
    if (hotelError) {
      console.log("❌ 完整错误信息:", JSON.stringify(hotelError, null, 2));
    }
  }, [hotelError]);

  // 从本地存储读取收藏状态（增加错误捕获）
  const loadFavoriteStatus = async () => {
    try {
      const existing = await AsyncStorage.getItem('favoriteHotels');
      const favorites = existing ? JSON.parse(existing) : {};
      setIsFavorite(!!favorites[hotelId]); // 强制布尔值
    } catch (e) {
      console.error('加载收藏状态失败:', e);
      setIsFavorite(false);
    }
  };

  // 切换收藏状态（带动画）
  const toggleFavorite = async () => {
    if (!hotelId) return; // 无hotelId时不执行

    // 心形点击动画
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

    // 更新收藏状态
    const newState = !isFavorite;
    setIsFavorite(newState);

    // 保存到本地存储
    try {
      const existing = await AsyncStorage.getItem('favoriteHotels');
      const favorites = existing ? JSON.parse(existing) : {};
      favorites[hotelId] = newState;
      await AsyncStorage.setItem('favoriteHotels', JSON.stringify(favorites));
    } catch (e) {
      console.error('保存收藏状态失败:', e);
    }
  };

  // 处理日历选择（统一格式为 YYYY-MM-DD）
  const handleDateSelect = (date: string) => {
    const formattedDate = date.replace(/\//g, '-');
    if (!checkInDate || (checkInDate && checkOutDate)) {
      setCheckInDate(formattedDate);
      setCheckOutDate('');
    } else {
      setCheckOutDate(formattedDate);
    }
  };

  // 适配 Room 类型的筛选逻辑（增加空值保护）
  const applyRoomFilters = (filters: FilterOptions) => {
    if (!hotel?.rooms || !Array.isArray(hotel.rooms)) {
      setFilteredRooms([]);
      return;
    }

    let filtered = [...hotel.rooms];

    // 1. 按价格区间筛选
    if (filters.priceRanges && filters.priceRanges.length > 0) {
      filtered = filtered.filter(room => {
        const price = Number(room.price) || 0; // 价格转数字，兜底0
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

    // 2. 按早餐筛选
    if (filters.breakfast && filters.breakfast.length > 0) {
      filtered = filtered.filter(room => {
        return filters.breakfast.some(bf => {
          if (bf === '含早餐' || bf === '双份早餐' || bf === '单份早餐') {
            return !!room.hasBreakfast; // 强制布尔值
          }
          return false;
        });
      });
    }

    // 3. 按服务筛选（免费取消）
    if (filters.services && filters.services.length > 0) {
      filtered = filtered.filter(room => {
        return filters.services.some(service => {
          if (service === '免费取消') return !!room.refundable;
          if (service === '立即确认') return true;
          return false;
        });
      });
    }

    // 4. 按面积筛选
    if (filters.area && filters.area.length > 0) {
      filtered = filtered.filter(room => {
        const area = Number(room.area) || 0; // 面积转数字，兜底0
        return filters.area.some(areaRange => {
          if (areaRange === '≥25㎡') return area >= 25;
          if (areaRange === '≥30㎡') return area >= 30;
          return false;
        });
      });
    }

    setFilteredRooms(filtered);
  };

  // 渲染星级（固定5星，后端无star字段时兜底）
  const renderStars = () => {
    return (
      <View style={styles.starsRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <FontAwesome
            key={i}
            name="star"
            size={14}
            color="#ffc107"
          />
        ))}
      </View>
    );
  };

  // 加载中状态
  if (hotelLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  // 错误状态（适配业务错误 + 网络错误）
  if (hotelError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>加载失败：{hotelError.message || '网络异常'}</Text>
        <TouchableOpacity onPress={() => refetchHotel()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#1890ff', fontSize: 16 }}>重新加载</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 8 }}>
          <Text style={{ color: '#666', fontSize: 14 }}>返回列表页</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 数据不存在/无hotelId
  if (!hotelId || !hotel) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{!hotelId ? '缺少酒店ID' : '未找到该酒店信息'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#1890ff', fontSize: 16 }}>返回列表页</Text>
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
        <Text style={styles.headerTitle} numberOfLines={1}>{hotel.name || '未知酒店'}</Text>
        {/* 带动画的收藏心形按钮 */}
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
        {/* 大图 Banner 轮播（空值保护） */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / Dimensions.get('window').width);
              setCurrentImageIndex(index);
            }}
          >
            {(hotel.images && Array.isArray(hotel.images) && hotel.images.length > 0) ? (
              hotel.images.map((img, index) => (
                <Image key={index} source={{ uri: img || 'https://placeholder.pics/svg/375x220/EEEEEE/666666/暂无图片' }} style={styles.bannerImage} />
              ))
            ) : (
              <Image source={{ uri: 'https://placeholder.pics/svg/375x220/EEEEEE/666666/暂无图片' }} style={styles.bannerImage} />
            )}
          </ScrollView>
          <View style={styles.imageIndicator}>
            <Text style={styles.imageIndicatorText}>
              {currentImageIndex + 1} / {hotel.images?.length || 1}
            </Text>
          </View>
          <View style={styles.imageTabs}>
            <Text style={[styles.imageTab, styles.imageTabActive]}>封面</Text>
            <Text style={styles.imageTab}>精选</Text>
            <Text style={styles.imageTab}>位置</Text>
            <Text style={styles.imageTab}>相册 &gt;</Text>
          </View>
        </View>

        {/* 酒店基础信息区（仅使用后端返回的字段） */}
        <View style={styles.infoCard}>
          <Text style={styles.hotelName}>{hotel.name || '未知酒店'}</Text>
          {renderStars()} {/* 固定5星，后端有star字段后可改为 hotel.star */}
          <View style={styles.rankRow}>
            <Ionicons name="trophy" size={16} color="#fa8c16" />
            <Text style={styles.rankText}>{'上海奢华酒店榜 No.1'}</Text> {/* 后端无rank字段，先固定 */}
          </View>

          {/* 标签：使用facilities字段，后端无tags时兜底 */}
          <View style={styles.tagsRow}>
            {(hotel.facilities && Array.isArray(hotel.facilities) ? hotel.facilities : ['高端酒店', '免费停车', '游泳池']).map((tag, i) => (
              <View key={i} style={[styles.tag, {
                backgroundColor: i % 3 === 0 ? '#e6f7ff' : i % 3 === 1 ? '#fff7e6' : '#f9f0ff'
              }]}>
                <Text style={[styles.tagText, {
                  color: i % 3 === 0 ? '#1890ff' : i % 3 === 1 ? '#fa8c16' : '#722ed1'
                }]}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreNumber}>{'4.9'}</Text> {/* 后端无score字段，先固定 */}
              <Text style={styles.scoreLabel}>超棒</Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.commentCount}>{hotel.favoriteCount || 0}条评价</Text> {/* 用favoriteCount兜底 */}
              <Text style={styles.commentSummary}>"{hotel.name || '体验超棒'}"</Text>
            </View>
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <View style={styles.addressInfo}>
              <Text style={styles.addressText}>{hotel.address || '暂无地址'}</Text>
              <TouchableOpacity style={styles.mapBtn}>
                <Text style={styles.mapBtnText}>地图</Text>
                <Ionicons name="chevron-forward" size={14} color="#1890ff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.facilitiesRow}>
            {(hotel.facilities && Array.isArray(hotel.facilities) ? hotel.facilities : ['免费WiFi', '空调', '电梯']).map((facility, i) => (
              <View key={i} style={styles.facilityItem}>
                <Ionicons name="checkmark-circle" size={16} color="#1890ff" />
                <Text style={styles.facilityLabel}>{facility}</Text>
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
            <Text style={styles.dateValue}>{checkInDate.replace(/-/g, '/')}</Text> {/* 显示为 YYYY/MM/DD 更友好 */}
          </View>
          <Ionicons name="swap-horizontal" size={20} color="#1890ff" />
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>离店</Text>
            <Text style={styles.dateValue}>{checkOutDate.replace(/-/g, '/')}</Text>
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

        <View style={styles.tipBar}>
          <Ionicons name="alert-circle" size={16} color="#fa8c16" />
          <Text style={styles.tipText}>当前已过0点，如需今天凌晨6点前入住，请选择"今天凌晨"</Text>
        </View>

        <View style={styles.filterBar}>
          <Text style={styles.filterTag}>含早餐</Text>
          <Text style={styles.filterTag}>立即确认</Text>
          <Text style={styles.filterTag}>大床房</Text>
          <Text style={styles.filterTag}>双床房</Text>
          <Text style={styles.filterTag}>免费取消</Text>
          <TouchableOpacity
            style={styles.filterMore}
            onPress={() => setIsFilterModalVisible(true)}
          >
            <Text style={styles.filterMoreText}>筛选</Text>
            <Ionicons name="chevron-down" size={14} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 附近景点/交通（适配后端nearbyPoi字段） */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>附近热门景点与交通</Text>
          {((hotel.nearbyPoi && Array.isArray(hotel.nearbyPoi)) ? hotel.nearbyPoi : (poiList || [])).map((item, i) => (
            <View key={i} style={styles.nearbyItem}>
              <Ionicons name="navigate-circle-outline" size={20} color="#1890ff" />
              <View style={styles.nearbyInfo}>
                <Text style={styles.nearbyName}>{item.name || '未知地点'}</Text>
                <Text style={styles.nearbyDesc}>{item.distanceKm ? `${item.distanceKm}公里` : '暂无距离'}，约15分钟</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 房型价格列表（适配 Room 类型） */}
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

          {/* 渲染筛选后的房型列表（空状态提示） */}
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
                    最多{guestCount}人
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

      {/* 底部预订栏（价格计算保护） */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomPrice}>¥{Math.min(...(hotel.rooms?.map(r => Number(r.price) || 0) || [0]))}</Text>
          <Text style={styles.bottomPriceUnit}>起</Text>
        </View>

        {/* 控制查看房型按钮显示/隐藏 */}
        {currentScrollY < roomSectionY && (
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
        )}
      </View>

      {/* 弹窗组件 */}
      <DateSelectorModal
        visible={isDateModalVisible}
        onClose={() => setIsDateModalVisible(false)}
        startDate={checkInDate}
        endDate={checkOutDate}
        onSelect={handleDateSelect}
      />

      <GuestSelectorModal
        visible={isGuestModalVisible}
        onClose={() => setIsGuestModalVisible(false)}
        currentCount={guestCount}
        onSelect={setGuestCount}
      />

      {/* 筛选弹窗 */}
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
});

export default DetailPage;
