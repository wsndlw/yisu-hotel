import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity,
    TextInput, ScrollView, Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { SEARCH_HOTELS, } from '../graphql/hotel-h5';
import {
    GET_FACILITIES_FOR_H5,
    FACILITY_CATEGORIES,
    groupFacilitiesByCategory
} from '../graphql/facility-h5';

import { useHomeConfigV2 } from '../services/hotel-h5';
import { useFacilitiesForH5 } from '../services/facility-h5';

// 引入组件
import DateSelectorModal from '../components/DateSelectorModal';
import CitySelectorModal from '../components/CitySelectorModal';
import PriceStarFilterModal from '../components/PriceStarFilterModal';
import LocationFilterModal from '../components/LocationFilterModal';

// ✅ 1. 修正排序选项 (必须严格匹配后端 Enum)
// 后端仅支持: DEFAULT, DISTANCE_ASC, PRICE_ASC, SCORE_DESC
const SORT_OPTIONS = [
    { label: '欢迎度排序', value: 'DEFAULT' },
    { label: '好评优先', value: 'SCORE_DESC' },
    { label: '低价优先', value: 'PRICE_ASC' },
    { label: '距离优先', value: 'DISTANCE_ASC' },
];

// 1. 在 ListPage 组件外定义一个映射（或者放在组件内也行）
const BED_TYPE_MAP: Record<string, string> = {
    'KING': '大床',
    'TWIN': '双床',
    'SINGLE': '单人床',
    'QUEEN': '大床',
};


const formatImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/300x400?text=No+Image';
    return url.startsWith('http') ? url : `https://${url}`;
};

const formatCount = (count: number) => {
    if (!count) return '0';
    return count > 10000 ? `${(count / 10000).toFixed(1)}万` : count;
};

const getNights = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.round((e - s) / (1000 * 60 * 60 * 24));
};

const renderStars = (count: number) => {
    const starCount = Math.max(0, Math.min(5, count || 3));
    const stars = [];
    for (let i = 0; i < starCount; i++) {
        stars.push(<Ionicons key={i} name="star" size={14} color="#FFD700" style={{ marginLeft: 2 }} />);
    }
    return stars;
};

const ListPage = ({ navigation, route }: any) => {
    const {
        cityCode = '320100', checkIn = '2026-02-23', checkOut = '2026-02-24', keyword = '',
        priceMin, priceMax, starRating, tags, displayInfo = {}
    } = route.params || {};

    const [keyWordInput, setKeyWordInput] = useState(keyword);
    const [searchKeyword, setSearchKeyword] = useState(keyword);
    // ✅ 默认排序改为大写 DEFAULT
    const [sortValue, setSortValue] = useState('DEFAULT');

    const [currentCity, setCurrentCity] = useState({ code: cityCode, name: displayInfo.cityName || '南京' });
    const [currentCheckIn, setCheckIn] = useState(checkIn);
    const [currentCheckOut, setCheckOut] = useState(checkOut);
    const nights = getNights(currentCheckIn, currentCheckOut);

    const [currentPriceMin, setPriceMin] = useState(priceMin);
    const [currentPriceMax, setPriceMax] = useState(priceMax);
    const [currentStar, setStar] = useState(starRating);

    const [selectedFacilities, setSelectedFacilities] = useState<string[]>(tags || []);
    // 弹窗控制状态增加 'location'
    const [activeModal, setActiveModal] = useState<'none' | 'sort' | 'filter' | 'city' | 'date' | 'priceStar' | 'location'>('none');

    const [page, setPage] = useState(1);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // ✅ 获取城市列表数据 (修复弹窗为空的问题)
    const { data: configData } = useHomeConfigV2();

    // facilities: 扁平数组，用于顶部快捷栏
    // facilitiesByCategory: 分组对象，用于筛选弹窗
    const { facilities, facilitiesByCategory: groupedFacilities, loading: facLoading } = useFacilitiesForH5();
    const [selectedLocationName, setSelectedLocationName] = useState('位置距离');

    const cityList = useMemo(() => configData?.cities || [], [configData]);

    // === GraphQL 查询 ===


    const { data, loading, error, refetch, fetchMore } = useQuery(SEARCH_HOTELS, {
        fetchPolicy: 'cache-and-network',
        variables: {
            input: {
                cityCode: currentCity.code,
                checkIn: currentCheckIn,
                checkOut: currentCheckOut,
                keyword: searchKeyword,
                priceMin: currentPriceMin,
                priceMax: currentPriceMax,
                starRating: currentStar,

                // ✅ 修正 2: 字段名改为 facilityIds (Schema 要求)
                facilityIds: selectedFacilities,

                sort: sortValue,

                // ✅ 修正 3: 分页必须包裹在 pagination 对象里 (Schema 要求)
                pagination: {
                    page: 1,
                    pageSize: 5
                }
            }
        },
        onError: (err) => console.log('❌ 搜索报错:', JSON.stringify(err)), // 方便调试
        onCompleted: (res) => {
            const total = res.searchHotels?.data?.total || 0;
            const items = res.searchHotels?.data?.items || [];
            if (items.length >= total) setHasMore(false);
            else setHasMore(true);
        }
    });

    const hotelList = useMemo(() => data?.searchHotels?.data?.items || [], [data]);

    // === 事件处理 ===
    const handleSearch = () => {
        setPage(1);
        setSearchKeyword(keyWordInput);
    };

    const handleLoadMore = () => {
        if (loading || !hasMore) return;
        console.log("📥 触发加载更多: Page", page + 1);

        fetchMore({
            variables: {
                input: {
                    cityCode: currentCity.code,
                    checkIn: currentCheckIn,
                    checkOut: currentCheckOut,
                    keyword: searchKeyword,
                    priceMin: currentPriceMin,
                    priceMax: currentPriceMax,
                    starRating: currentStar,
                    facilityIds: selectedFacilities, // ✅ 记得这里也要改
                    sort: sortValue,

                    // ✅ 分页结构保持嵌套
                    pagination: {
                        page: page + 1,
                        pageSize: 10
                    }
                }
            },
            updateQuery: (prev, { fetchMoreResult }) => {
                if (!fetchMoreResult) return prev;
                const newItems = fetchMoreResult.searchHotels.data.items;
                const total = fetchMoreResult.searchHotels.data.total;
                if (newItems.length === 0 || (hotelList.length + newItems.length) >= total) {
                    setHasMore(false);
                }
                setPage(prevPage => prevPage + 1);
                return {
                    searchHotels: {
                        ...fetchMoreResult.searchHotels,
                        data: {
                            ...fetchMoreResult.searchHotels.data,
                            items: [...prev.searchHotels.data.items, ...newItems]
                        }
                    }
                };
            }
        });
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setPage(1);
        setHasMore(true);
        await refetch();
        setIsRefreshing(false);
    };

    // ✅ 4. 修复日期选择逻辑：支持选两个日期
    const handleDateSelect = (d: string) => {
        // 如果还没有开始日期，或者已经选好了开始和结束（重新开始选）
        if (!currentCheckIn || (currentCheckIn && currentCheckOut)) {
            setCheckIn(d);
            setCheckOut(''); // 清空结束日期，等待第二次点击
            // 注意：此时不要关闭弹窗，让用户继续选
        }
        // 如果只有开始日期，且点击的日期晚于开始日期
        else if (currentCheckIn && !currentCheckOut) {
            if (d > currentCheckIn) {
                setCheckOut(d);
                setActiveModal('none'); // 选完两个了，关闭弹窗
                setPage(1); // 触发刷新
            } else {
                // 如果用户点了比开始日期还早的，就把它重置为新的开始日期
                setCheckIn(d);
            }
        }
    };

    const handlePriceStarConfirm = (pStr: string, sStr: string) => {
        let min, max;
        if (pStr.includes('以下')) max = parseInt(pStr.replace(/\D/g, ''));
        else if (pStr.includes('以上')) min = parseInt(pStr.replace(/\D/g, ''));
        else if (pStr.includes('-')) {
            const parts = pStr.split('-');
            min = parseInt(parts[0].replace(/\D/g, ''));
            max = parseInt(parts[1].replace(/\D/g, ''));
        }

        let star;
        if (sStr.includes('2')) star = 2;
        else if (sStr.includes('3')) star = 3;
        else if (sStr.includes('4')) star = 4;
        else if (sStr.includes('5')) star = 5;

        setPriceMin(min);
        setPriceMax(max);
        setStar(star);
        setPage(1);
    };

    // ✅ 统一的设施切换函数 (快捷栏和筛选弹窗都用它)
    const toggleFacility = (id: string) => {
        setPage(1);
        const newSet = new Set(selectedFacilities);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedFacilities(Array.from(newSet));
    };

    const renderItem = ({ item }: any) => {
        const coverImage = (item.images && item.images.length > 0) ? item.images[0].url : '';
        const dynamicTags = [];
        // 1. 获取第一个房型的信息（通常列表页展示最低价房型的属性）
        const firstRoom = (item.roomType && item.roomType.length > 0) ? item.roomType[0] : null;

        // 2. 真实床型标签
        if (firstRoom && firstRoom.bedType) {
            // 如果映射里有就用映射的，没有就显示英文原值，或者空
            const bedText = BED_TYPE_MAP[firstRoom.bedType] || '大床';
            dynamicTags.push({ text: bedText, color: '#333', bg: '#F5F5F5' });
        }

        // 3. 窗户标签 (根据你提供的数据，还有一个 hasWindow 字段)
        if (firstRoom && firstRoom.hasWindow) {
            dynamicTags.push({ text: '有窗', color: '#333', bg: '#F5F5F5' });
        }

        // 4. 免费取消 (保持原有逻辑)
        if (item.roomType?.some((r: any) => r.refundable)) {
            dynamicTags.push({ text: '免费取消', color: '#0086F6', bg: '#F0F8FF' });
        }

        // 5. 含早餐 (保持原有逻辑)
        if (item.roomType?.some((r: any) => r.hasBreakfast)) {
            dynamicTags.push({ text: '含早餐', color: '#FF9500', bg: '#FFF7E6' }); // 换个颜色区分一下
        }

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Detail', { 
                    id: item.id,
                    checkIn: currentCheckIn, // 这里填你 state 里存的入住日期变量
                    checkOut: currentCheckOut   // 这里填你 state 里存的离店日期变量 
                })}
            >
                <View style={styles.imageWrapper}>
                    <Image source={{ uri: formatImageUrl(coverImage) }} style={styles.cardImg} resizeMode="cover" />
                    <View style={styles.playIcon}><Ionicons name="play" size={12} color="#fff" /></View>
                </View>
                <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.starContainer}>{renderStars(item.starLevel)}</View>
                    </View>
                    <View style={styles.scoreRow}>
                        <View style={styles.scoreBadge}><Text style={styles.scoreText}>{item.score || '4.8'}</Text></View>
                        <Text style={styles.scoreDesc}>超棒</Text>
                        <Text style={styles.commentText}>
                            {formatCount(item.favoriteCount || 2300)} 收藏 · {formatCount(Math.floor((item.favoriteCount || 2300) / 2))} 条点评
                        </Text>
                    </View>
                    <Text style={styles.locationText} numberOfLines={1}>{item.distanceText || '市中心'} · {item.address}</Text>
                    <View style={styles.tagRow}>
                        {dynamicTags.map((tag, i) => (
                            <View key={i} style={[styles.tagContainer, { backgroundColor: tag.bg }]}>
                                <Text style={[styles.tagText, { color: tag.color }]}>{tag.text}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={styles.bottomRow}>
                        {/* 新增：钻石贵宾价标签 */}
                        <View style={styles.vipTag}>
                            <Text style={styles.vipText}>钻石贵宾价</Text>
                        </View>
                        <View style={styles.priceContainer}>
                            <Text style={styles.currency}>¥</Text>
                            <Text style={styles.price}>{item.minPrice || '---'}</Text>
                            <Text style={styles.qi}>起</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>

                <View style={styles.capsule}>
                    <TouchableOpacity onPress={() => setActiveModal('city')}>
                        <Text style={styles.capsuleCity}>{currentCity.name}</Text>
                    </TouchableOpacity>
                    <View style={styles.capsuleDivider} />
                    <TouchableOpacity onPress={() => setActiveModal('date')}>
                        <View>
                            <Text style={styles.capsuleDate}>{currentCheckIn ? currentCheckIn.substring(5) : '日期'} 入</Text>
                            <Text style={styles.capsuleDate}>{currentCheckOut ? currentCheckOut.substring(5) : '日期'} 离</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.capsuleDivider} />
                    <View><Text style={styles.capsuleNights}>共{nights}晚</Text></View>
                    <Ionicons name="caret-down" size={10} color="#666" style={{ marginLeft: 4 }} />
                </View>

                <View style={styles.searchBox}>
                    <Ionicons name="search" size={14} color="#999" />
                    <TextInput
                        style={styles.input}
                        placeholder="关键字"
                        placeholderTextColor="#ccc"
                        value={keyWordInput}
                        onChangeText={setKeyWordInput}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                </View>
                <TouchableOpacity style={styles.mapIconBtn}>
                    <Ionicons name="map" size={20} color="#0086F6" />
                    <Text style={styles.mapText}>地图</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.filterBar}>
                <TouchableOpacity style={styles.filterItem} onPress={() => setActiveModal('sort')}>
                    <Text style={[styles.filterText, sortValue !== 'DEFAULT' && styles.activeText]}>
                        {SORT_OPTIONS.find(o => o.value === sortValue)?.label || '排序'}
                    </Text>
                    <Ionicons name="caret-down" size={10} color={sortValue !== 'DEFAULT' ? '#0086F6' : '#666'} />
                </TouchableOpacity>

                {/* ✅ 修改：位置距离按钮 */}
                <TouchableOpacity
                    style={styles.filterItem}
                    onPress={() => setActiveModal('location')} // 打开新弹窗
                >
                    <Text style={[
                        styles.filterText,
                        selectedLocationName !== '位置距离' && styles.activeText // 选中变蓝
                    ]}>
                        {selectedLocationName}
                    </Text>
                    <Ionicons
                        name="caret-down"
                        size={10}
                        color={selectedLocationName !== '位置距离' ? '#0086F6' : '#666'}
                    />
                </TouchableOpacity>

                <TouchableOpacity style={styles.filterItem} onPress={() => setActiveModal('priceStar')}>
                    <Text style={[styles.filterText, (currentPriceMin || currentStar) && styles.activeText]}>价格星级</Text>
                    <Ionicons name="caret-down" size={10} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.filterItem} onPress={() => setActiveModal('filter')}>
                    <Text style={[styles.filterText, selectedFacilities.length > 0 && styles.activeText]}>筛选</Text>
                    <Ionicons name="filter" size={12} color={selectedFacilities.length > 0 ? '#0086F6' : '#666'} />
                </TouchableOpacity>
            </View>

            {/* ✅ 3. 第二栏：快捷标签 (直接使用设施列表) */}
            <View style={{ height: 44, backgroundColor: '#fff', borderBottomWidth: 0.5, borderColor: '#eee' }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickTagsContainer}>
                    {facLoading ? (
                        <Text style={{ color: '#999', fontSize: 12, padding: 10 }}>加载设施...</Text>
                    ) : (
                        // 直接遍历所有设施，不做分类，实现“右滑更多”
                        facilities.map((fac: any) => {
                            const isSelected = selectedFacilities.includes(fac.id);
                            return (
                                <TouchableOpacity
                                    key={fac.id}
                                    style={[styles.quickTag, isSelected && styles.quickTagActive]}
                                    onPress={() => toggleFacility(fac.id)}
                                >
                                    <Text style={[styles.quickTagText, isSelected && styles.quickTagTextActive]}>
                                        {fac.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>
            </View>

            <FlatList
                data={hotelList}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.2}
                ListFooterComponent={() => (
                    loading && page > 1 ? (
                        <View style={{ padding: 10 }}><ActivityIndicator color="#0086F6" /></View>
                    ) : (
                        !hasMore && hotelList.length > 0 ?
                            <Text style={{ textAlign: 'center', color: '#999', padding: 10 }}>没有更多了</Text> : null
                    )
                )}
                ListEmptyComponent={
                    !loading ? <Text style={{ textAlign: 'center', marginTop: 50, color: '#999' }}>未找到符合条件的酒店</Text> : null
                }
            />

            <CitySelectorModal
                visible={activeModal === 'city'}
                onClose={() => setActiveModal('none')}
                onSelect={(city: any) => { setCurrentCity(city); setActiveModal('none'); setPage(1); }}
                data={cityList}
            />

            {/* ✅ 日期选择器：现在 onSelect 的逻辑允许选两个日期了 */}
            <DateSelectorModal
                visible={activeModal === 'date'}
                startDate={currentCheckIn} endDate={currentCheckOut}
                onClose={() => setActiveModal('none')}
                onSelect={handleDateSelect}
            />

            <Modal visible={activeModal === 'sort'} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setActiveModal('none')}>
                    <View style={styles.modalContentTop}>
                        {SORT_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={styles.sortOption}
                                onPress={() => { setSortValue(opt.value); setActiveModal('none'); setPage(1); }}
                            >
                                <Text style={[styles.sortText, sortValue === opt.value && styles.activeText]}>{opt.label}</Text>
                                {sortValue === opt.value && <Ionicons name="checkmark" size={18} color="#0086F6" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ✅ 挂载位置筛选弹窗 */}
            <LocationFilterModal
                visible={activeModal === 'location'}
                cityCode={currentCity.code} // 传入当前城市
                onClose={() => setActiveModal('none')}
                onSelect={(poi) => {
                    if (poi) {
                        // 选中了某个地点
                        setSelectedLocationName(poi.name);
                    } else {
                        // 选中了“不限”
                        setSelectedLocationName('位置距离');
                        // setSearchKeyword(''); // 清空搜索
                    }
                }}
            />

            <PriceStarFilterModal
                visible={activeModal === 'priceStar'}
                onClose={() => setActiveModal('none')}
                onConfirm={handlePriceStarConfirm}
            />



            <Modal visible={activeModal === 'filter'} animationType="slide" transparent>
                <View style={styles.modalOverlayBottom}>
                    <View style={styles.filterModalContent}>
                        <View style={styles.filterHeader}>
                            <Text style={styles.filterTitle}>筛选</Text>
                            <TouchableOpacity onPress={() => setActiveModal('none')} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.filterScroll}>
                            {Object.entries(groupedFacilities).map(([category, items]: any) => {
                                const label = (FACILITY_CATEGORIES as any)[category]?.label || '其他';
                                return (
                                    <View key={category} style={styles.filterSection}>
                                        <Text style={styles.categoryTitle}>{label}</Text>
                                        <View style={styles.filterGrid}>
                                            {items.map((fac: any) => {
                                                const isActive = selectedFacilities.includes(fac.id);
                                                return (
                                                    <TouchableOpacity
                                                        key={fac.id}
                                                        style={[styles.filterChip, isActive && styles.filterChipActive]}
                                                        onPress={() => toggleFacility(fac.id)}
                                                    >
                                                        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{fac.name}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                        <View style={styles.filterFooter}>
                            <TouchableOpacity style={styles.resetBtn} onPress={() => setSelectedFacilities([])}>
                                <Text style={styles.resetText}>清空</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmBtn} onPress={() => setActiveModal('none')}>
                                <Text style={styles.confirmText}>确定 ({selectedFacilities.length})</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// 🎨 样式 (保持最新版)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },

    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
        paddingVertical: 8, backgroundColor: '#fff', marginTop: 44
    },
    backBtn: { marginRight: 8 },
    capsule: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f2f2',
        borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8, height: 36,
    },
    capsuleCity: { fontSize: 13, fontWeight: 'bold', color: '#333' },
    capsuleDivider: { width: 1, height: 14, backgroundColor: '#ccc', marginHorizontal: 6 },
    capsuleDate: { fontSize: 10, color: '#333', lineHeight: 11 },
    capsuleNights: { fontSize: 10, color: '#0086F6', fontWeight: 'bold', lineHeight: 11 },

    searchBox: {
        flex: 1,
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f2f2',
        borderRadius: 18, height: 36, paddingHorizontal: 10
    },
    input: { flex: 1, fontSize: 13, color: '#333', marginLeft: 6 },
    mapIconBtn: { alignItems: 'center', marginLeft: 10 },
    mapText: { fontSize: 10, color: '#0086F6' },

    filterBar: { flexDirection: 'row', height: 40, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 0.5, borderColor: '#eee' },
    filterItem: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    filterText: { fontSize: 13, color: '#333', marginRight: 4 },
    activeText: { color: '#0086F6', fontWeight: 'bold' },

    quickTagsContainer: { paddingHorizontal: 12, alignItems: 'center' },
    quickTag: { backgroundColor: '#f5f7fa', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, marginRight: 8 },
    quickTagActive: { backgroundColor: '#E6F4FF' },
    quickTagText: { fontSize: 12, color: '#666' },
    quickTagTextActive: { color: '#0086F6', fontWeight: 'bold' },

    card: { flexDirection: 'row', backgroundColor: '#fff', marginBottom: 12, borderRadius: 12, overflow: 'hidden', padding: 10 },
    imageWrapper: { width: 110, height: 150, borderRadius: 8, overflow: 'hidden', position: 'relative' },
    cardImg: { width: '100%', height: '100%' },
    playIcon: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1, marginLeft: 10, justifyContent: 'space-between' },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    cardName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginRight: 4, maxWidth: '70%' },
    starContainer: { flexDirection: 'row', alignItems: 'center', paddingTop: 2 },
    scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    scoreBadge: { backgroundColor: '#0086F6', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, marginRight: 4 },
    scoreText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    scoreDesc: { color: '#0086F6', fontSize: 12, fontWeight: 'bold', marginRight: 6 },
    commentText: { color: '#666', fontSize: 11 },
    locationText: { color: '#999', fontSize: 11, marginTop: 4 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
    tagContainer: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, marginRight: 4, marginBottom: 4 },
    tagText: { fontSize: 10 },

    bottomRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',     // 底部对齐
        justifyContent: 'flex-end', // 靠右对齐
        marginTop: 8
    },

    // ✅ 新增：VIP 标签容器样式（带边框）
    vipTag: {
        borderWidth: 0.5,           // 细边框
        borderColor: '#0086F6',     // 蓝色边框 (与主题色一致，也可以换成金色 #FF9500)
        borderRadius: 2,            // 小圆角
        paddingHorizontal: 4,       // 水平内边距
        paddingVertical: 1,         // 垂直内边距
        marginRight: 8,             // 与右侧价格拉开距离
        marginBottom: 4,            //稍微往上抬一点，与价格数字底部视觉对齐
        backgroundColor: '#F0F8FF'  // 可选：极淡的蓝色背景，增加质感
    },

    // ✅ 新增：VIP 文字样式
    vipText: {
        fontSize: 10,               // 小字号
        color: '#0086F6',           // 蓝色文字
        fontWeight: '500'
    },
    priceContainer: { flexDirection: 'row', alignItems: 'flex-end' },
    currency: { color: '#0086F6', fontSize: 12, marginBottom: 3, fontWeight: 'bold' },
    price: { color: '#0086F6', fontSize: 20, fontWeight: 'bold', lineHeight: 22 },
    qi: { color: '#999', fontSize: 10, marginBottom: 3, marginLeft: 1 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalOverlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContentTop: { backgroundColor: '#fff', marginTop: 128, marginHorizontal: 0, padding: 10, borderRadius: 8 },
    sortOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 0.5, borderColor: '#eee', paddingHorizontal: 20 },
    sortText: { fontSize: 14, color: '#333' },

    filterModalContent: { backgroundColor: '#fff', height: '70%', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
    filterHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 50, borderBottomWidth: 0.5, borderColor: '#eee' },
    filterTitle: { fontSize: 16, fontWeight: 'bold' },
    closeBtn: { position: 'absolute', right: 15 },
    filterScroll: { flex: 1 },
    filterSection: { padding: 15 },
    categoryTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    filterGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    filterChip: { width: '30%', backgroundColor: '#f5f7fa', paddingVertical: 8, alignItems: 'center', borderRadius: 4, marginBottom: 10, marginRight: '3%' },
    filterChipActive: { backgroundColor: '#E6F4FF' },
    filterChipText: { fontSize: 12, color: '#666' },
    filterChipTextActive: { color: '#0086F6' },
    filterFooter: { flexDirection: 'row', height: 60, borderTopWidth: 0.5, borderColor: '#eee', paddingHorizontal: 15, alignItems: 'center', justifyContent: 'space-between' },
    resetBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, marginRight: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
    resetText: { color: '#666' },
    confirmBtn: { flex: 2, alignItems: 'center', backgroundColor: '#0086F6', paddingVertical: 10, borderRadius: 20 },
    confirmText: { color: '#fff', fontWeight: 'bold' },
});

export default ListPage;