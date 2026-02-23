import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
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
import dayjs from 'dayjs'; // 如果没装dayjs，可以用原生Date代替

// ✅ 1. 引入后端服务
import { useHomeConfigV2 } from '../services/hotel-h5';
// 引入弹窗组件
import CitySelectorModal from '../components/CitySelectorModal';
import DateSelectorModal from '../components/DateSelectorModal';

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

const { width } = Dimensions.get('window');
const SWIPER_HEIGHT = 260;

// === 工具函数 ===
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
    return `${month}月${day}日 ${weekday}`;
}

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getTomorrowStr = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
};

const getNights = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.round((e - s) / (1000 * 60 * 60 * 24));
};

// ================= 主组件 =================
const SearchPage = () => {
    const navigation = useNavigation<any>();

    // ✅ 获取后端数据
    const { data: homeData, loading, error } = useHomeConfigV2();

    // 🔴 在这里加一行打印
    if (error) {
        console.log("❌ GraphQL 请求失败:", JSON.stringify(error, null, 2));
    }
    if (homeData) {
        console.log("✅ 获取到数据:", JSON.stringify(homeData, null, 2));
    }

     const realData = homeData?.homeConfig?.data || homeData?.homeConfig;

    // 🔴 关键修复：使用 useMemo 缓存数据，防止 useEffect 死循环
    const banners = useMemo(() => realData?.banners || [], [realData]);
    const backendCities = useMemo(() => realData?.cities || [], [realData]);
    const facilities = useMemo(() => {
        const remote = realData?.facilities || [];
        if (remote.length > 0) return remote;

        // Mock 数据
        return [
            { id: '1', name: '免费取消' },
            { id: '2', name: '近地铁' },
            { id: '3', name: '含早餐' },
            { id: '4', name: '免费停车' }
        ];
    }, [realData]);
    // === 状态管理 ===
    // 简化 Tab，只保留 'hotel' (原domestic), 'homestay', 'hourly'
    const [activeTab, setActiveTab] = useState('hotel');

    // 城市状态
    const [city, setCity] = useState({ name: '北京', code: '110100', country: '' });
    const [modalVisible, setModalVisible] = useState(false);

    // 日期状态
    const [dateModalVisible, setDateModalVisible] = useState(false);
    const [startDate, setStartDate] = useState(getTodayStr());
    const [endDate, setEndDate] = useState(getTomorrowStr());
    const totalNights = getNights(startDate, endDate);

    // 价格星级状态
    const [priceModalVisible, setPriceModalVisible] = useState(false);
    const [selectedPrice, setSelectedPrice] = useState<string>('');
    const [selectedStar, setSelectedStar] = useState<string>('');

    // 快捷标签状态
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // ✅ 修复后的 useEffect：只在数据加载完成且当前城市不匹配时更新
    useEffect(() => {
        if (backendCities.length > 0) {
            const firstCity = backendCities[0];
            // 只有当当前的 code 和后端第一个城市的 code 不一样时，才执行 setCity
            // 这样就阻断了无限循环
            if (city.code !== firstCity.code && city.code === '110100') {
                // 注意：这里加了个判断，只有当前是默认值(北京)时才自动切，避免用户选了别的城市又被切回来
                setCity({
                    name: firstCity.name,
                    code: firstCity.code,
                    country: ''
                });
            }
        }
    }, [backendCities]); // 依赖项里去掉了 activeTab，因为现在不需要切来切去了

    // 日历标记逻辑
    const markedDates = useMemo(() => {
        let marks: any = {};
        if (!startDate) return marks;
        marks[startDate] = { startingDay: true, color: '#0086F6', textColor: 'white' };
        if (endDate) {
            marks[endDate] = { endingDay: true, color: '#0086F6', textColor: 'white' };
            let start = new Date(startDate);
            let end = new Date(endDate);
            let curr = new Date(start);
            curr.setDate(curr.getDate() + 1);
            while (curr < end) {
                const dateStr = curr.toISOString().split('T')[0];
                marks[dateStr] = { color: '#E6F7FF', textColor: '#333' };
                curr.setDate(curr.getDate() + 1);
            }
        }
        return marks;
    }, [startDate, endDate]);

    // 处理城市选择
    const handleSelectCity = (item: any) => {
        setCity({
            name: item.name,
            code: item.code,
            country: ''
        });
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
    const toggleTag = (tagName: string) => {
        if (selectedTags.includes(tagName)) setSelectedTags(selectedTags.filter(t => t !== tagName));
        else setSelectedTags([...selectedTags, tagName]);
    };

    const getPriceStarText = () => {
        if (!selectedPrice && !selectedStar) return '价格/星级';
        return `${selectedPrice} ${selectedStar}`.trim();
    };

    // 点击查询
    const handleSearch = () => {
        navigation.navigate('HotelList', { // 确保 App.tsx 里叫 HotelList
            cityCode: city.code,
            checkIn: startDate,
            checkOut: endDate,
            displayInfo: {
                cityName: city.name,
                price: selectedPrice,
                star: selectedStar,
                tags: selectedTags
            }
        });
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

            {/* 城市选择弹窗 (只传国内数据) */}
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

            {/* 价格/星级弹窗 */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={priceModalVisible}
                onRequestClose={() => setPriceModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '70%' }]}>
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
                                        onPress={() => banner.redirectHotelId && navigation.navigate('HotelDetail', { id: banner.redirectHotelId })}
                                    >
                                        <Image source={{ uri: banner.imageUrl }} style={styles.image} resizeMode='cover' />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </Carousel>
                    ) : (
                        // 🔴 调试用：如果 banners 为空，显示这个红色方块
                        <View style={{ height: 260, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: 'white' }}>Banner 数据为空</Text>
                        </View>
                    )}
                </View>

                {/* 悬浮搜索卡片 */}
                <View style={styles.searchCard}>
                    {/* Tab 栏：酒店 | 民宿 | 钟点房 */}
                    <View style={styles.bookmarkWrapper}>
                        <TouchableOpacity style={[styles.bookmarkItem, activeTab === 'hotel' && styles.bookmarkActive]} onPress={() => setActiveTab('hotel')}>
                            <Text style={[styles.tabText, activeTab === 'hotel' && styles.activeTabText]}>酒店</Text>
                            {activeTab === 'hotel' && <View style={styles.activeLine} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.bookmarkItem, activeTab === 'homestay' && styles.bookmarkActive]} onPress={() => setActiveTab('homestay')}>
                            <Text style={[styles.tabText, activeTab === 'homestay' && styles.activeTabText]}>民宿</Text>
                            {activeTab === 'homestay' && <View style={styles.activeLine} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.bookmarkItem, activeTab === 'hourly' && styles.bookmarkActive]} onPress={() => setActiveTab('hourly')}>
                            <Text style={[styles.tabText, activeTab === 'hourly' && styles.activeTabText]}>钟点房</Text>
                            {activeTab === 'hourly' && <View style={styles.activeLine} />}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.cardContent}>
                        {/* 城市与搜索栏 */}
                        <View style={styles.searchRow}>
                            <TouchableOpacity style={styles.citySelector} onPress={() => setModalVisible(true)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.cityText}>{city.name}</Text>
                                    <Ionicons name="caret-down" size={12} color="#333" style={{ marginLeft: 4 }} />
                                </View>
                            </TouchableOpacity>
                            <View style={styles.inputWrapper}>
                                <TextInput placeholder="关键字/位置/品牌" placeholderTextColor="#ccc" style={styles.searchInput} />
                            </View>
                            <TouchableOpacity style={styles.mapIconBtn}>
                                <Ionicons name="map" size={20} color="#0086F6" />
                                <Text style={styles.mapText}>地图</Text>
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
                                        onPress={() => toggleTag(facility.name)}
                                        style={[styles.tagItem, selectedTags.includes(facility.name) && styles.tagItemSelected]}
                                    >
                                        <Text style={[styles.tagText, selectedTags.includes(facility.name) && styles.tagTextSelected]}>
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

                {/* 底部占位 */}
                <View style={{ padding: 20 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>本周特惠</Text>
                    <View style={{ height: 100, backgroundColor: '#f0f0f0', borderRadius: 8 }} />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { paddingBottom: 20 },
    wrapper: { height: SWIPER_HEIGHT, width: '100%' },
    carousel: { height: SWIPER_HEIGHT, width: '100%', backgroundColor: '#eee' },
    slide: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
    image: { width: width, height: SWIPER_HEIGHT },

    // Search Card
    searchCard: { marginHorizontal: 12, marginTop: -40 },
    bookmarkWrapper: { flexDirection: 'row', height: 44, backgroundColor: 'rgba(255,255,255,0.85)', borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: 'hidden' },
    bookmarkItem: { flex: 1, justifyContent: 'center', alignItems: 'center', height: '100%' },
    bookmarkActive: { backgroundColor: '#fff' },
    tabText: { fontSize: 15, color: '#333', fontWeight: '500' },
    activeTabText: { color: '#0086F6', fontWeight: 'bold', fontSize: 17 },
    activeLine: { position: 'absolute', bottom: -6, left: '20%', width: '60%', height: 3, backgroundColor: '#0086F6', borderRadius: 2 },

    // Card Content
    cardContent: { backgroundColor: '#fff', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, padding: 16, paddingTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },

    // Search Row
    searchRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 15 },
    citySelector: { marginRight: 15, minWidth: 70 },
    cityText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    inputWrapper: { flex: 1, height: 40, justifyContent: 'center' },
    searchInput: { fontSize: 16, color: '#333' },
    mapIconBtn: { alignItems: 'center', marginLeft: 10 },
    mapText: { fontSize: 10, color: '#0086F6' },

    // Date Row
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    dateMainText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    dateDivider: { width: 1, height: 14, backgroundColor: '#ddd', marginHorizontal: 8 },
    nightCountText: { fontSize: 14, color: '#333', marginRight: 4 },

    // Price Row
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
    priceRowText: { fontSize: 18, color: '#ccc', fontWeight: '500' },

    // Tags
    quickTagsWrapper: { marginTop: 0, marginBottom: 10 },
    tagItem: { backgroundColor: '#f5f7fa', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
    tagItemSelected: { backgroundColor: '#e6f7ff', borderColor: '#0086F6' },
    tagText: { color: '#333', fontSize: 13 },
    tagTextSelected: { color: '#0086F6', fontWeight: 'bold' },

    // Button
    searchBtn: { backgroundColor: '#0086F6', height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginTop: 20, shadowColor: '#0086F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    searchBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '50%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridItem: { width: '30%', backgroundColor: '#f5f7fa', paddingVertical: 10, borderRadius: 6, marginBottom: 10, alignItems: 'center', justifyContent: 'center' },
    gridItemSelected: { backgroundColor: '#e6f7ff', borderColor: '#0086F6', borderWidth: 1 },
    gridText: { fontSize: 13, color: '#333', textAlign: 'center' },
    gridSubText: { fontSize: 11, color: '#999', marginTop: 2 },
    gridTextSelected: { color: '#0086F6', fontWeight: 'bold' },
    filterFooter: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
    resetBtn: { flex: 1, marginRight: 10, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
    resetBtnText: { color: '#333', fontSize: 16 },
    okBtn: { flex: 2, height: 44, borderRadius: 22, backgroundColor: '#0086F6', justifyContent: 'center', alignItems: 'center' },
    okBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default SearchPage;