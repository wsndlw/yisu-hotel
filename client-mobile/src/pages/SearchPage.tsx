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
import * as Location from 'expo-location';

//  引入后端服务
import { useHomeConfigV2 } from '../services/hotel-h5';
//  引入弹窗组件
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

    // 城市状态
    const [city, setCity] = useState({ name: '北京', code: '110100', country: '' });
    const [modalVisible, setModalVisible] = useState(false);

    // 搜索框文字
    const [keyword, setKeyword] = useState('');

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

    //  定位相关状态
    const [isLocated, setIsLocated] = useState(false); // 是否已定位
    const [locationTip, setLocationTip] = useState(''); // 顶部气泡提示
    const [isLocating, setIsLocating] = useState(false); // 定位Loading状态


    // 初始化城市 (仅一次)
    useEffect(() => {
        if (backendCities.length > 0) {
            const firstCity = backendCities[0];
            if (city.code !== firstCity.code && city.code === '110100') {
                setCity({
                    name: firstCity.name,
                    code: firstCity.code,
                    country: ''
                });
            }
        }
    }, [backendCities]);

    // 处理城市选择
    const handleSelectCity = (item: any) => {
        setCity({
            ...city,
            name: item.name,
            code: item.code,
        });
        // 
        setIsLocated(false);
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

    //  解析价格字符串
    const parsePrice = (priceStr: string) => {
        if (!priceStr) return { min: undefined, max: undefined };

        // 1. 处理 "¥200以下" -> max: 200
        if (priceStr.includes('以下')) {
            const max = parseInt(priceStr.replace(/[^0-9]/g, ''));
            return { min: 0, max };
        }
        // 2. 处理 "¥2000以上" -> min: 2000
        if (priceStr.includes('以上')) {
            const min = parseInt(priceStr.replace(/[^0-9]/g, ''));
            return { min, max: undefined };
        }
        // 3. 处理 "¥200-¥350" -> min: 200, max: 350
        const parts = priceStr.split('-');
        if (parts.length === 2) {
            return {
                min: parseInt(parts[0].replace(/[^0-9]/g, '')),
                max: parseInt(parts[1].replace(/[^0-9]/g, ''))
            };
        }
        return { min: undefined, max: undefined };
    };

    // 解析星级 
    const parseStar = (starStr: string) => {
        if (!starStr) return undefined;
        if (starStr.includes('2')) return 2;
        if (starStr.includes('3')) return 3;
        if (starStr.includes('4')) return 4;
        if (starStr.includes('5')) return 5;
        if (starStr.includes('钻')) return 5;
        return undefined;
    };

    //   定位功能函数
    const handleLocate = async () => {
        setIsLocating(true);
        try {
            console.log("1. 开始请求权限...");
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('定位权限被拒绝');
                return;
            }

            console.log("2. 权限通过，正在获取经纬度...");
            //  增加 accuracy 和 timeout，防止安卓模拟器卡死
            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            console.log("3. 获取到坐标:", location.coords);

            console.log("4. 正在解析地址(逆地理编码)...");
            let addressResponse = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            console.log("5. 解析结果:", addressResponse);

            if (addressResponse.length === 0) {
                console.log(" 模拟器无法解析地址，使用兜底数据");
                addressResponse = [{
                    city: '旧金山',
                    name: '苹果总部',
                    district: 'Cupertino',
                    street: 'Infinite Loop',
                    region: 'California',
                    country: 'USA',
                    postalCode: '95014',
                    timezone: 'America/Los_Angeles',
                    isoCountryCode: 'US',
                    subregion: 'Santa Clara County'
                }] as any;
            }

            if (addressResponse && addressResponse.length > 0) {
                const addr = addressResponse[0];
                // 兼容不同系统的字段名
                const cityName = addr.city || addr.region || addr.subregion || city.name;
                const detailName = addr.name || addr.street || addr.district || '附近';

                //  关键：只有这里执行了，UI 才会变
                console.log("6. 更新UI状态 ->", cityName);
                setCity(prev => ({ ...prev, name: cityName }));
                setIsLocated(true);
                setLocationTip(`已定位到 ${cityName} · ${detailName}`);

                setTimeout(() => setLocationTip(''), 3000);
            } else {
                alert("未解析到地址信息，请检查网络或模拟器位置设置");
            }
        } catch (error: any) {
            console.log("定位流程出错:", error);
            alert("定位失败: " + error.message);
        } finally {
            setIsLocating(false);
        }
    };

    // 点击查询
    const handleSearch = () => {
        const { min, max } = parsePrice(selectedPrice);
        const star = parseStar(selectedStar);

        const searchParams = {
            cityCode: city.code,
            checkIn: startDate,
            checkOut: endDate,
            keyword: keyword,
            priceMin: min,
            priceMax: max,
            starRating: star,
            tags: selectedTags,
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
                                            {isLocated ? '我的位置' : city.name}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    scrollContent: {
        paddingBottom: 20
    },
    wrapper: {
        height: SWIPER_HEIGHT,
        width: '100%'
    },
    carousel: {
        height: SWIPER_HEIGHT,
        width: '100%',
        backgroundColor: '#eee'
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent'
    },
    image: {
        width: width,
        height: SWIPER_HEIGHT
    },

    // Search Card
    searchCard: {
        marginHorizontal: 12,
        marginTop: -40
    },
    bookmarkWrapper: {
        flexDirection: 'row',
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        overflow: 'hidden'
    },
    bookmarkItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
    },
    bookmarkActive: {
        backgroundColor: '#fff'
    },
    tabText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500'
    },
    activeTabText: {
        color: '#0086F6',
        fontWeight: 'bold',
        fontSize: 17
    },
    activeLine: {
        position: 'absolute',
        bottom: -6,
        left: '20%',
        width: '60%',
        height: 3,
        backgroundColor: '#0086F6',
        borderRadius: 2
    },

    // Card Content
    cardContent: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        padding: 16,
        paddingTop: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3
    },

    // Search Row
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 15
    },
    citySelector: {
        marginRight: 15,
        minWidth: 70
    },
    cityText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333'
    },
    inputWrapper: {
        flex: 1,
        height: 40,
        justifyContent: 'center'
    },
    searchInput: {
        fontSize: 16,
        color: '#333'
    },
    bubbleContainer: {
        position: 'absolute',
        top: -22.5, // 向上浮动
        left: 0,
        zIndex: 10,
    },
    bubble: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 4,
    },
    bubbleText: {
        color: '#fff',
        fontSize: 12,
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderBottomWidth: 0,
        borderTopWidth: 6,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: 'rgba(0,0,0,0.7)',
        marginLeft: 10, // 调整小三角的位置
    },
    mapIconBtn: {
        alignItems: 'center',
        marginLeft: 10
    },
    mapText: {
        fontSize: 10,
        color: '#0086F6'
    },

    // Date Row
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    dateMainText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    dateDivider: {
        width: 1,
        height: 14,
        backgroundColor: '#ddd',
        marginHorizontal: 8
    },
    nightCountText: {
        fontSize: 14,
        color: '#333',
        marginRight: 4
    },

    // Price Row
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18
    },
    priceRowText: {
        fontSize: 18,
        color: '#ccc',
        fontWeight: '500'
    },

    // Tags
    quickTagsWrapper: {
        marginTop: 0,
        marginBottom: 10
    },
    tagItem: {
        backgroundColor: '#f5f7fa',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 4,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    tagItemSelected: {
        backgroundColor: '#e6f7ff',
        borderColor: '#0086F6'
    },
    tagText: {
        color: '#333',
        fontSize: 13
    },
    tagTextSelected: {
        color: '#0086F6',
        fontWeight: 'bold'
    },

    // Button
    searchBtn: {
        backgroundColor: '#0086F6',
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#0086F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    searchBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '50%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    gridItem: {
        width: '30%',
        backgroundColor: '#f5f7fa',
        paddingVertical: 10,
        borderRadius: 6,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    gridItemSelected: {
        backgroundColor: '#e6f7ff',
        borderColor: '#0086F6',
        borderWidth: 1
    },
    gridText: {
        fontSize: 13,
        color: '#333',
        textAlign: 'center'
    },
    gridSubText: {
        fontSize: 11,
        color: '#999',
        marginTop: 2
    },
    gridTextSelected: {
        color: '#0086F6',
        fontWeight: 'bold'
    },
    filterFooter: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    resetBtn: {
        flex: 1,
        marginRight: 10,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    resetBtnText: {
        color: '#333',
        fontSize: 16
    },
    okBtn: {
        flex: 2,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0086F6',
        justifyContent: 'center',
        alignItems: 'center'
    },
    okBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },

    bottomSection: {
        padding: 20,
        paddingTop: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },

    // 大图卡片
    specialMainCard: {
        height: 140,
        borderRadius: 16, // 圆角
        overflow: 'hidden',
        marginBottom: 15,
        position: 'relative', // 用于定位蒙层
        backgroundColor: '#f0f0f0', // 加载时的底色
    },
    specialMainImage: {
        width: '100%',
        height: '100%',
    },
    specialImageOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.25)', // 轻微的黑色半透明蒙层，让文字更清晰
        padding: 16,
        justifyContent: 'space-between',
    },
    specialTag: {
        backgroundColor: '#FF4D4F',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    specialTagText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    specialOverlayText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },

    // 三个小框容器
    threeBoxesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    // 单个小框
    smallBox: {
        flex: 1,
        height: 110, // 固定高度
        borderRadius: 16, // 圆角
        padding: 12,
        marginHorizontal: 5, // 框之间的间距
        justifyContent: 'center',
        //alignItems: 'center', // 居中对齐
        position: 'relative',
        overflow: 'hidden',
    },
    // 小框的装饰性大图标
    boxDecorationIcon: {
        position: 'absolute',
        right: -15,
        bottom: -15,
        opacity: 0.15, // 非常淡的透明度
        transform: [{ rotate: '-15deg' }] //稍微倾斜一点
    },
    boxTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    boxSubtitle: {
        fontSize: 11,
        color: '#666',
    },

});

export default SearchPage;