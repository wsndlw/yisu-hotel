import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    View,
    Text,
    Image,
    Linking,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    ActivityIndicator
} from 'react-native';
import { Carousel } from '@ant-design/react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

//  引入后端服务
import { useHomeConfigV2 } from '../../services/hotel-h5';
//  引入弹窗组件
import CitySelectorModal from '../../components/CitySelectorModal';
import DateSelectorModal from '../../components/DateSelectorModal';
import {
    parsePriceLabel,
    parseStarLabel,
    useHotelSearchStore,
} from '../../store/hotelSearchStore';
import {
    CurrentLocationError,
    getCurrentSupportedLocation,
} from '../../utils/current-location';
//  引入样式
import styles from './SearchPage.styles';


// === 静态数据 ===
const PRICES = ['¥200以下', '¥200-¥350', '¥350-¥450', '¥450-¥550', '¥550-¥750', '¥750-¥1000', '¥1000-¥1500', '¥1500-¥2000', '¥2000以上'];
const STARS = [
    { label: '2钻/星', desc: '经济' },
    { label: '3钻/星', desc: '舒适' },
    { label: '4钻/星', desc: '高档' },
    { label: '5钻/星', desc: '豪华' },
    { label: '金钻酒店', desc: '奢华体验' },
    { label: '铂钻酒店', desc: '超奢品质' }
];
// 底部三个小框
const SPECIAL_BOXES = [
    {
        title: '口碑榜',
        subtitle: '千万好评精选',
        icon: 'ribbon-outline', // Ionicons 名称
        color: '#FF9500',       // 主题色 (橙)
        bg: '#FFF7E6'           // 浅背景色
    },
    {
        title: '特惠套餐',
        subtitle: '一键省心游',
        icon: 'gift-outline',   // Ionicons 名称
        color: '#FF4D4F',       // 主题色 (红)
        bg: '#FFF1F0'
    },
    {
        title: '超值低价',
        subtitle: '好货不贵',
        icon: 'pricetag-outline', // Ionicons 名称
        color: '#0086F6',         // 主题色 (蓝)
        bg: '#E6F4FF'
    },
];

// === 工具函数 ===
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
    return `${month}月${day}日 ${weekday}`;
}

const getNights = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.round((e - s) / (1000 * 60 * 60 * 24));
};

// ================= 主组件 =================
const SearchPage = () => {
    const navigation = useNavigation<any>();

    //  获取后端数据
    const { data: homeData, loading, error } = useHomeConfigV2();

    if (error) {
        console.log("GraphQL 请求失败:", JSON.stringify(error, null, 2));
    }

    // 缓存 Banner 数据
    const banners = useMemo(() => {
        return homeData?.banners || [];
    }, [homeData]);

    const lastBanner = useMemo(() => {
        if (banners.length > 0) {
            return banners[banners.length - 1];
        }
        return null;
    }, [banners]);

    // 缓存城市数据
    const backendCities = useMemo(() => {
        return homeData?.cities || [];
    }, [homeData]);

    // 缓存设施标签
    const facilities = useMemo(() => {
        const remote = homeData?.facilities || [];
        if (remote.length > 0) return remote;
        return [
            { id: '1', name: '免费取消' },
            { id: '2', name: '近地铁' },
            { id: '3', name: '含早餐' },
            { id: '4', name: '免费停车' }
        ];
    }, [homeData]);


    // === 状态管理 ===
    const [activeTab, setActiveTab] = useState('hotel');

    // 查询页与列表页共用同一份查询条件，返回时会自动显示列表页的最新选择。
    const {
        city,
        keyword,
        checkIn: startDate,
        checkOut: endDate,
        selectedPrice,
        selectedStar,
        selectedTags,
        setCity,
        setKeyword,
        setCheckIn: setStartDate,
        setCheckOut: setEndDate,
        setSelectedPrice,
        setSelectedStar,
        setSelectedTags,
    } = useHotelSearchStore();

    const [modalVisible, setModalVisible] = useState(false);

    const [dateModalVisible, setDateModalVisible] = useState(false);
    const totalNights = getNights(startDate, endDate);

    const [priceModalVisible, setPriceModalVisible] = useState(false);

    //  定位相关状态
    const isLocated = (
        Number.isFinite(city.latitude)
        && Number.isFinite(city.longitude)
    );
    const [locationTip, setLocationTip] = useState(''); // 顶部气泡提示
    const [isLocating, setIsLocating] = useState(false); // 定位Loading状态
    const locationTipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


    // 初始化城市 (仅一次)
    useEffect(() => {
        if (backendCities.length > 0) {
            const firstCity = backendCities[0];
            if (!isLocated && city.code !== firstCity.code && city.code === '110100') {
                setCity({
                    name: firstCity.name,
                    code: firstCity.code,
                    country: ''
                });
            }
        }
    }, [backendCities, isLocated]);

    useEffect(() => () => {
        if (locationTipTimer.current) clearTimeout(locationTipTimer.current);
    }, []);

    const showLocationTip = (message: string) => {
        if (locationTipTimer.current) clearTimeout(locationTipTimer.current);
        setLocationTip(message);
        locationTipTimer.current = setTimeout(() => setLocationTip(''), 4000);
    };

    // 处理城市选择
    const handleSelectCity = (item: any) => {
        setCity({
            name: item.name,
            code: item.code,
            country: '',
        });
        setLocationTip(''); // 顺便把头顶的气泡也清空（如果有的话）
        setModalVisible(false);
    };

    // 日期选择回调
    const handleDateSelect = (dateStr: string) => {
        if (!startDate || (startDate && endDate)) {
            setStartDate(dateStr); setEndDate('');
        } else if (startDate && !endDate) {
            if (dateStr > startDate) setEndDate(dateStr);
            else setStartDate(dateStr);
        }
    };

    // 价格/标签多选逻辑
    const togglePrice = (p: string) => setSelectedPrice(selectedPrice === p ? '' : p);
    const toggleStar = (s: string) => setSelectedStar(selectedStar === s ? '' : s);

    // 这样传给后端更准确
    const toggleTag = (tagId: string) => {
        if (selectedTags.includes(tagId)) {
            setSelectedTags(selectedTags.filter(t => t !== tagId));
        } else {
            setSelectedTags([...selectedTags, tagId]);
        }
    };

    const getPriceStarText = () => {
        if (!selectedPrice && !selectedStar) return '价格/星级';
        return `${selectedPrice} ${selectedStar}`.trim();
    };

    //   定位功能函数
    const handleLocate = async () => {
        if (isLocating) return;
        setIsLocating(true);
        try {
            const result = await getCurrentSupportedLocation(backendCities);
            setCity({
                code: result.city.code,
                name: result.city.name,
                country: result.country || '',
                latitude: result.coordinates.latitude,
                longitude: result.coordinates.longitude,
            });
            const detail = result.detailName ? ` · ${result.detailName}` : '';
            showLocationTip(
                result.usedNearestCityFallback
                    ? `已按当前位置匹配到 ${result.city.name}`
                    : `已定位到 ${result.city.name}${detail}`,
            );
        } catch (error) {
            console.warn('定位流程出错:', error);
            if (!(error instanceof CurrentLocationError)) {
                Alert.alert('定位失败', '暂时无法完成定位，请稍后重试');
                return;
            }

            if (error.code === 'PERMISSION_BLOCKED') {
                Alert.alert(
                    '需要定位权限',
                    '定位权限已被关闭，请在系统设置中允许易宿酒店使用您的位置。',
                    [
                        { text: '取消', style: 'cancel' },
                        {
                            text: '打开设置',
                            onPress: () => void Linking.openSettings(),
                        },
                    ],
                );
            } else if (error.code === 'PERMISSION_DENIED') {
                Alert.alert('未获得定位权限', '允许定位权限后才能自动匹配所在城市。');
            } else if (error.code === 'SERVICES_DISABLED') {
                Alert.alert('定位服务未开启', '请先在系统设置中开启定位服务，然后重试。');
            } else if (error.code === 'UNSUPPORTED_CITY') {
                Alert.alert(
                    '当前位置暂不支持',
                    `${error.placeName ? `已定位到 ${error.placeName}，但` : ''}当前没有可查询的酒店城市，请手动选择城市。`,
                );
            } else if (error.code === 'GEOCODING_UNAVAILABLE') {
                Alert.alert(
                    '暂时无法识别城市',
                    '已经取得当前位置，但地址解析服务暂时不可用。请检查网络后重试，或手动选择城市。',
                );
            } else {
                Alert.alert('定位失败', error.message);
            }
        } finally {
            setIsLocating(false);
        }
    };

    // 点击查询
    const handleSearch = () => {
        const { priceMin, priceMax } = parsePriceLabel(selectedPrice);
        const starRating = parseStarLabel(selectedStar);

        const searchParams = {
            cityCode: city.code,
            checkIn: startDate,
            checkOut: endDate,
            keyword: keyword,
            priceMin,
            priceMax,
            starRating,
            tags: selectedTags,
            latitude: city.latitude,
            longitude: city.longitude,
            selectedPrice,
            selectedStar,
            displayInfo: {
                cityName: city.name,
                dateRange: `${formatDate(startDate)}-${formatDate(endDate)}`,
            }
        };

        console.log("跳转列表页参数:", searchParams);
        navigation.navigate('HotelList', searchParams);
    };

    if (loading && !homeData) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#0086F6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" translucent backgroundColor="transparent" />

            {/* 城市选择弹窗 */}
            <CitySelectorModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSelect={handleSelectCity}
                data={backendCities}
            />

            {/* 日期选择弹窗 */}
            <DateSelectorModal
                visible={dateModalVisible}
                onClose={() => setDateModalVisible(false)}
                startDate={startDate}
                endDate={endDate}
                onSelect={handleDateSelect}
            />

            {/*  价格/星级弹窗 ( */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={priceModalVisible}
                onRequestClose={() => setPriceModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setPriceModalVisible(false)} />
                    <View style={[styles.modalContent, { height: '60%' }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setPriceModalVisible(false)}>
                                <Ionicons name='close' size={24} color='#333' />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>选择价格/星级</Text>
                            <View style={{ width: 24 }} />
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            <Text style={styles.sectionTitle}>价格区间</Text>
                            <View style={styles.gridContainer}>
                                {PRICES.map((p, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.gridItem, selectedPrice === p && styles.gridItemSelected]}
                                        onPress={() => togglePrice(p)}
                                    >
                                        <Text style={[styles.gridText, selectedPrice === p && styles.gridTextSelected]}>{p}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={{ height: 20 }} />
                            <Text style={styles.sectionTitle}>星级/钻级</Text>
                            <View style={styles.gridContainer}>
                                {STARS.map((s, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.gridItem, selectedStar === s.label && styles.gridItemSelected]}
                                        onPress={() => toggleStar(s.label)}
                                    >
                                        <Text style={[styles.gridText, selectedStar === s.label && styles.gridTextSelected]}>{s.label}</Text>
                                        <Text style={styles.gridSubText}>{s.desc}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                        <View style={styles.filterFooter}>
                            <TouchableOpacity style={styles.resetBtn} onPress={() => { setSelectedPrice(''); setSelectedStar(''); }}>
                                <Text style={styles.resetBtnText}>清空</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.okBtn} onPress={() => setPriceModalVisible(false)}>
                                <Text style={styles.okBtnText}>完成</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps='handled'>
                {/* 顶部 Banner */}
                <View style={styles.wrapper}>
                    {banners.length > 0 ? (
                        <Carousel style={styles.carousel} autoplay infinite autoplayInterval={3000}>
                            {banners.map((banner: any, index: number) => (
                                <View key={banner.id || index} style={styles.slide}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => banner.redirectHotelId && navigation.navigate('Detail', {
                                            id: banner.redirectHotelId,
                                            checkInDate: startDate,
                                            checkOutDate: endDate
                                        })}
                                    >
                                        <Image source={{ uri: banner.imageUrl }} style={styles.image} resizeMode='cover' />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </Carousel>
                    ) : (
                        <View style={{ height: 260, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: '#999' }}>加载 Banner 中...</Text>
                        </View>
                    )}
                </View>

                {/* 悬浮搜索卡片 */}
                <View style={styles.searchCard}>
                    {/* Tab 栏 */}
                    <View style={styles.bookmarkWrapper}>
                        {['hotel', 'homestay', 'hourly'].map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.bookmarkItem, activeTab === tab && styles.bookmarkActive]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                    {tab === 'hotel' ? '酒店' : tab === 'homestay' ? '民宿' : '钟点房'}
                                </Text>
                                {activeTab === tab && <View style={styles.activeLine} />}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.cardContent}>
                        {/* 城市与搜索栏 */}
                        <View style={styles.searchRow}>
                            {/*  悬浮气泡提示  */}
                            {locationTip ? (
                                <View style={styles.bubbleContainer}>
                                    <View style={styles.bubble}>
                                        <Text style={styles.bubbleText}>{locationTip}</Text>
                                    </View>
                                    <View style={styles.triangle} />
                                </View>
                            ) : null}

                            {/* 左侧城市/位置选择 */}
                            <TouchableOpacity style={styles.citySelector} onPress={() => setModalVisible(true)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {/* 增加定位状态判断 */}
                                    <View>
                                        <Text style={[styles.cityText, isLocated && { fontSize: 16, color: '#0086F6' }]}>
                                            {city.name}
                                        </Text>
                                        {/* 如果定位了，这里可以额外显示一个小标或者保持原样 */}
                                    </View>
                                    {!isLocated && <Ionicons name="caret-down" size={12} color="#333" style={{ marginLeft: 4 }} />}
                                </View>
                            </TouchableOpacity>

                            {/* 中间输入框 */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    placeholder="关键字/位置/品牌"
                                    placeholderTextColor="#ccc"
                                    style={styles.searchInput}
                                    value={keyword}
                                    onChangeText={setKeyword}
                                />
                            </View>

                            {/*  右侧按钮：点击触发定位 */}
                            <TouchableOpacity style={styles.mapIconBtn} onPress={handleLocate}>
                                {isLocating ? (
                                    <ActivityIndicator size="small" color="#0086F6" />
                                ) : (
                                    <>
                                        {/* 图标换成了 locate (靶心) */}
                                        <Ionicons name={isLocated ? "locate" : "locate-outline"} size={22} color="#0086F6" />
                                        <Text style={styles.mapText}>{isLocated ? '已定位' : '定位'}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* 日期选择 */}
                        <TouchableOpacity style={styles.dateRow} onPress={() => setDateModalVisible(true)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <Text style={styles.dateMainText}>{formatDate(startDate)}</Text>
                                <View style={styles.dateDivider} />
                                <Text style={styles.dateMainText}>{endDate ? formatDate(endDate) : '请选择'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.nightCountText}>共{totalNights}晚</Text>
                                <Ionicons name="chevron-forward" size={16} color="#ccc" />
                            </View>
                        </TouchableOpacity>

                        {/* 价格/星级 */}
                        <TouchableOpacity style={styles.priceRow} onPress={() => setPriceModalVisible(true)}>
                            <Text style={[styles.priceRowText, (selectedPrice || selectedStar) && { color: '#333', fontWeight: 'bold' }]}>
                                {getPriceStarText()}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="#ccc" />
                        </TouchableOpacity>

                        {/* 快捷标签 */}
                        <View style={styles.quickTagsWrapper}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: -5 }}>
                                {facilities.length > 0 && facilities.map((facility: any) => (
                                    <TouchableOpacity
                                        key={facility.id}
                                        //  点击存的是 ID
                                        onPress={() => toggleTag(facility.id)}
                                        //  判断样式也要查 ID
                                        style={[
                                            styles.tagItem,
                                            selectedTags.includes(facility.id) && styles.tagItemSelected
                                        ]}
                                    >
                                        {/*  文字样式判断也要查 ID */}
                                        <Text style={[
                                            styles.tagText,
                                            selectedTags.includes(facility.id) && styles.tagTextSelected
                                        ]}>
                                            {facility.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* 查询按钮 */}
                        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                            <Text style={styles.searchBtnText}>查 询</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/*  底部：本周特惠 */}
                <View style={styles.bottomSection}>
                    <Text style={styles.sectionTitle}>本周特惠</Text>

                    {/*  大图卡片  */}
                    {lastBanner ? (
                        <TouchableOpacity
                            style={styles.specialMainCard}
                            activeOpacity={0.9}
                            onPress={() => {
                                if (lastBanner.redirectHotelId) {
                                    navigation.navigate('Detail', {
                                        id: lastBanner.redirectHotelId,
                                        checkInDate: startDate,
                                        checkOutDate: endDate
                                    });
                                }
                            }}
                        >
                            <Image source={{ uri: lastBanner.imageUrl }} style={styles.specialMainImage} resizeMode="cover" />

                            <View style={styles.specialImageOverlay}>
                                <View style={styles.specialTag}>
                                    <Text style={styles.specialTagText}>当季力荐</Text>
                                </View>
                                <View>
                                    <Text style={styles.specialOverlayText}>品质出行 · 甄选好店</Text>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                        <Text style={{ color: '#fff', fontSize: 12 }}>立即查看</Text>
                                        <Ionicons name="arrow-forward" size={12} color="#fff" style={{ marginLeft: 2 }} />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.specialMainCard, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ color: '#999' }}>敬请期待更多特惠</Text>
                        </View>
                    )}

                    <View style={styles.threeBoxesContainer}>
                        {SPECIAL_BOXES.map((box, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.smallBox, { backgroundColor: box.bg }]}
                                activeOpacity={0.8}
                            >
                                {/* 右上角的装饰性图标背景 */}
                                <Ionicons name={box.icon as any} size={60} color={box.color} style={styles.boxDecorationIcon} />

                                {/* 前景内容 */}
                                <Ionicons name={box.icon as any} size={28} color={box.color} style={{ marginBottom: 8 }} />
                                <Text style={[styles.boxTitle, { color: box.color }]}>{box.title}</Text>
                                <Text style={styles.boxSubtitle}>{box.subtitle}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

export default SearchPage;
