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
import { useNavigation } from '@react-navigation/native'; // 引入路由钩子

// ✅ 1. 引入后端服务和类型
import { useHomeConfigV2 } from '../services/hotel-h5';
// 引入你的弹窗组件 (保持路径不变)
import CitySelectorModal from '../components/CitySelectorModal';
import DateSelectorModal from '../components/DateSelectorModal';

// ===  静态数据 (价格/星级这种配置项通常前端写死，或者也有专门的字典接口) ===
const PRICES = ['¥200以下', '¥200-¥350', '¥350-¥450', '¥450-¥550', '¥550-¥750', '¥750-¥1000', '¥1000-¥1500', '¥1500-¥2000', '¥2000以上'];
const STARS = [
    { label: '2钻/星', desc: '经济' },
    { label: '3钻/星', desc: '舒适' },
    { label: '4钻/星', desc: '高档' },
    { label: '5钻/星', desc: '豪华' },
    { label: '金钻酒店', desc: '奢华体验' },
    { label: '铂钻酒店', desc: '超奢品质' }
];

// 海外城市暂时还是 Mock 数据 (因为后端 homeConfig 可能只返回了热门城市)
const CITIES_OVERSEAS = [
    { country: '韩国', name: '首尔', code: 'SEOUL' }, // 假定一个 code
    { country: '日本', name: '东京', code: 'TOKYO' },
    { country: '法国', name: '巴黎', code: 'PARIS' },
    { country: '美国', name: '旧金山', code: 'SF' },
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

    // ✅ 2. 获取后端数据
    // useHomeConfigV2 已经帮你聚合了 Banner、Cities、Facilities
    const { data: homeData, loading, error, refetch } = useHomeConfigV2();

    // 提取数据 (加默认值防止报错)
    const banners = homeData?.banners || [];
    const backendCities = homeData?.cities || []; // 后端返回的热门城市
    const facilities = homeData?.facilities || []; // 后端返回的设施(用作快捷标签)

    // === 状态管理 ===
    const [activeTab, setActiveTab] = useState('domestic');

    // 城市状态：增加了 code 字段
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
    const [selectedTags, setSelectedTags] = useState<string[]>([]); // 存的是 ID 或 Name

    // ✅ 3. 初始化默认城市 (当后端数据加载完成后，默认选中第一个热门城市)
    useEffect(() => {
        if (backendCities.length > 0 && activeTab === 'domestic') {
            // 如果还没选过城市，或者当前是初始值，就更新为后端第一个城市
            // 这里逻辑可根据需求调整，比如是否记住用户上次选择
            setCity({ 
                name: backendCities[0].name, 
                code: backendCities[0].code, 
                country: '' 
            });
        }
    }, [backendCities]);

    // 切换 Tab 时重置城市
    useEffect(() => {
        if (activeTab === 'overseas') {
            setCity({ name: '首尔', code: 'SEOUL', country: '韩国' });
        } else if (activeTab === 'domestic' && backendCities.length > 0) {
            setCity({ 
                name: backendCities[0].name, 
                code: backendCities[0].code, 
                country: '' 
            });
        }
    }, [activeTab]);

    // 日历标记逻辑 (保持不变)
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
        // 后端返回的 item 结构通常是 { code: string, name: string }
        // 或者是你 Mock 的海外数据
        setCity({ 
            name: item.name, 
            code: item.code, // ✅ 关键：一定要保存 code
            country: item.country || '' 
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

    // 价格星级多选逻辑 (保持不变)
    const togglePrice = (p: string) => setSelectedPrice(selectedPrice === p ? '' : p);
    const toggleStar = (s: string) => setSelectedStar(selectedStar === s ? '' : s);
    const getPriceStarText = () => {
        if (!selectedPrice && !selectedStar) return '价格/星级';
        return `${selectedPrice} ${selectedStar}`.trim();
    };

    // 标签多选逻辑 (这里改为存 ID 比较好，但为了 UI 显示先存 Name)
    const toggleTag = (tagName: string) => {
        if (selectedTags.includes(tagName)) {
            setSelectedTags(selectedTags.filter(t => t !== tagName));
        } else {
            setSelectedTags([...selectedTags, tagName]);
        }
    };

    // ✅ 4. 核心：点击查询按钮
    const handleSearch = () => {
        // 构造传给列表页的参数
        navigation.navigate('HotelList', { // 确保你的路由名字是 'HotelList'
            cityCode: city.code, // 必填：后端要 code
            checkIn: startDate,  // 必填
            checkOut: endDate,   // 必填
            // 选填参数
            keyword: '', 
            priceMin: undefined, // 这里的价格解析逻辑比较复杂，暂时先不做
            priceMax: undefined,
            starRating: undefined, // 需要把 '5钻' 转换成数字 5，这里暂略
            // 传递 UI 显示用的参数，方便列表页回显
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
                <Text style={{ marginTop: 10, color: '#999' }}>加载配置中...</Text>
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
                // ✅ 这里国内数据使用后端返回的 backendCities
                data={activeTab === 'overseas' ? CITIES_OVERSEAS : backendCities}
            />

            {/* 日期选择弹窗 */}
            <DateSelectorModal
                visible={dateModalVisible}
                onClose={() => setDateModalVisible(false)}
                startDate={startDate}
                endDate={endDate}
                onSelect={handleDateSelect}
            />

            {/* 价格/星级弹窗 (保持不变) */}
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
                                {PRICES.map((p, i) => {
                                    const isSelected = selectedPrice === p;
                                    return (
                                        <TouchableOpacity 
                                            key={i} 
                                            style={[styles.gridItem, isSelected && styles.gridItemSelected]} 
                                            onPress={() => togglePrice(p)}
                                        >
                                            <Text style={[styles.gridText, isSelected && styles.gridTextSelected]}>{p}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <View style={{ height: 20 }} />

                            <Text style={styles.sectionTitle}>星级/钻级</Text>
                            <View style={styles.gridContainer}>
                                {STARS.map((s, i) => {
                                    const isSelected = selectedStar === s.label;
                                    return (
                                        <TouchableOpacity 
                                            key={i} 
                                            style={[styles.gridItem, isSelected && styles.gridItemSelected]} 
                                            onPress={() => toggleStar(s.label)}
                                        >
                                            <Text style={[styles.gridText, isSelected && styles.gridTextSelected]}>{s.label}</Text>
                                            <Text style={styles.gridSubText}>{s.desc}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
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

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                contentInsetAdjustmentBehavior='never'
                keyboardShouldPersistTaps='handled'
            >
                {/* 顶部 Banner 区域 (动态数据) */}
                <View style={styles.wrapper}>
                    {banners.length > 0 ? (
                        <Carousel
                            style={styles.carousel}
                            autoplay
                            infinite
                            autoplayInterval={3000}
                            dotStyle={styles.dot}
                            dotActiveStyle={styles.activeDot}
                        >
                            {banners.map((banner: any, index: number) => (
                                <View key={banner.id || index} style={styles.slide}>
                                    <TouchableOpacity 
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            // 如果有跳转ID，去详情页
                                            if (banner.redirectHotelId) {
                                                navigation.navigate('HotelDetail', { id: banner.redirectHotelId });
                                            }
                                        }}
                                    >
                                        <Image
                                            // ✅ 使用后端返回的 imageUrl
                                            source={{ uri: banner.imageUrl }}
                                            style={styles.image}
                                            resizeMode='cover'
                                        />
                                    </TouchableOpacity>
                                    {/* 可以在这里加个简单的遮罩显示文字，如果后端没返回文字就不显示 */}
                                </View>
                            ))}
                        </Carousel>
                    ) : (
                        // 兜底图
                        <View style={[styles.slide, { backgroundColor: '#ddd' }]}>
                            <Text style={{ color: '#999' }}>暂无活动</Text>
                        </View>
                    )}
                </View>

                {/* 悬浮搜索卡片 */}
                <View style={styles.searchCard}>
                    <View style={styles.bookmarkWrapper}>
                        <View style={[styles.bookmarkItem, (activeTab === 'domestic' || activeTab === 'overseas') && styles.bookmarkActive]}>
                            <View style={styles.splitTabRow}>
                                <TouchableOpacity onPress={() => setActiveTab('domestic')}>
                                    <Text style={[styles.tabText, activeTab === 'domestic' && styles.activeTabText]}>国内</Text>
                                    {activeTab === 'domestic' && <View style={styles.activeLine} />}
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setActiveTab('overseas')} style={{ marginLeft: 15 }}>
                                    <Text style={[styles.tabText, activeTab === 'overseas' && styles.activeTabText]}>海外</Text>
                                    {activeTab === 'overseas' && <View style={styles.activeLine} />}
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity style={[styles.bookmarkItem, activeTab === 'homestay' && styles.bookmarkActive]} onPress={() => setActiveTab('homestay')}>
                            <Text style={[styles.tabText, activeTab === 'homestay' && styles.activeTabText]}>民宿</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.bookmarkItem, activeTab === 'hourly' && styles.bookmarkActive]} onPress={() => setActiveTab('hourly')}>
                            <Text style={[styles.tabText, activeTab === 'hourly' && styles.activeTabText]}>钟点房</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.cardContent}>
                        {/* 城市与搜索栏 */}
                        <View style={styles.searchRow}>
                            <TouchableOpacity
                                style={styles.citySelector}
                                onPress={() => setModalVisible(true)}
                            >
                                {activeTab === 'overseas' && city.country ? <Text style={styles.countryText}>{city.country}</Text> : null}
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.cityText}>{city.name}</Text>
                                    <Ionicons name="caret-down" size={12} color="#333" style={{ marginLeft: 4 }} />
                                </View>
                            </TouchableOpacity>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    placeholder="关键字/位置/品牌"
                                    placeholderTextColor="#ccc"
                                    style={styles.searchInput} 
                                />
                            </View>
                            <TouchableOpacity style={styles.mapIconBtn}>
                                <Ionicons name="map" size={20} color="#0086F6" />
                                <Text style={styles.mapText}>地图</Text>
                            </TouchableOpacity>
                        </View>

                        {/* 日期选择 */}
                        <TouchableOpacity
                            style={styles.dateRow}
                            onPress={() => setDateModalVisible(true)}
                        >
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
                        <TouchableOpacity
                            style={styles.priceRow}
                            onPress={() => setPriceModalVisible(true)}
                        >
                            <Text style={[
                                styles.priceRowText, 
                                (selectedPrice || selectedStar) && { color: '#333', fontWeight: 'bold' }
                            ]}>
                                {getPriceStarText()}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="#ccc" />
                        </TouchableOpacity>

                        {/* 快捷标签 (使用后端 facilities 数据) */}
                        <View style={styles.quickTagsWrapper}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={{ marginLeft: -5 }}
                            >
                                {/* 如果后端没数据，就不渲染 */}
                                {facilities.length > 0 && facilities.map((facility: any, index: number) => {
                                    // 这里的 facility 是 { id, name }
                                    const isSelected = selectedTags.includes(facility.name);

                                    return (
                                        <TouchableOpacity
                                            key={facility.id}
                                            onPress={() => toggleTag(facility.name)}
                                            style={[
                                                styles.tagItem,
                                                isSelected && styles.tagItemSelected
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.tagText,
                                                    isSelected && styles.tagTextSelected
                                                ]}
                                            >
                                                {facility.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
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
    dot: { backgroundColor: 'rgba(255,255,255,0.4)', width: 8, height: 8, borderRadius: 4, marginHorizontal: 3, marginBottom: 10 },
    activeDot: { backgroundColor: '#fff', width: 20, height: 8, borderRadius: 4, marginHorizontal: 3, marginBottom: 10 },
    
    // Search Card
    searchCard: { marginHorizontal: 12, marginTop: -40 },
    bookmarkWrapper: { flexDirection: 'row', height: 44, backgroundColor: 'rgba(255,255,255,0.85)', borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: 'hidden' },
    bookmarkItem: { flex: 1, justifyContent: 'center', alignItems: 'center', height: '100%' },
    bookmarkActive: { backgroundColor: '#fff' },
    splitTabRow: { flexDirection: 'row', alignItems: 'center' },
    tabText: { fontSize: 15, color: '#333', fontWeight: '500' },
    activeTabText: { color: '#0086F6', fontWeight: 'bold', fontSize: 17 },
    activeLine: { position: 'absolute', bottom: -6, left: '20%', width: '60%', height: 3, backgroundColor: '#0086F6', borderRadius: 2 },
    
    // Card Content
    cardContent: { backgroundColor: '#fff', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, padding: 16, paddingTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
    
    // Search Row
    searchRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 15 },
    citySelector: { marginRight: 15, minWidth: 70 },
    countryText: { fontSize: 12, color: '#999', marginBottom: 2 },
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

    // Modal
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