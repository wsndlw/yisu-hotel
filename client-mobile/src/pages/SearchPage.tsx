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
} from 'react-native';
import { Carousel } from '@ant-design/react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';// 图标库

// typescript逻辑

// ✅ 1. 引入抽离的弹窗组件
import CitySelectorModal from '../components/CitySelectorModal';
import DateSelectorModal from '../components/DateSelectorModal';

// ===  数据准备 ===
const PRICES = ['¥200以下', '¥200-¥350', '¥350-¥450', '¥450-¥550', '¥550-¥750', '¥750-¥1000', '¥1000-¥1500', '¥1500-¥2000', '¥2000以上'];
const STARS = [
    { label: '2钻/星', desc: '经济' },
    { label: '3钻/星', desc: '舒适' },
    { label: '4钻/星', desc: '高档' },
    { label: '5钻/星', desc: '豪华' },
    { label: '金钻酒店', desc: '奢华体验' },
    { label: '铂钻酒店', desc: '超奢品质' }
];

// 快捷标签数据 (上海示例)
const QUICK_TAGS = ['我的附近', '外滩', '迪士尼', '南京路', '虹桥', '浦东机场', '双床房', '免费取消', '含早餐'];

// 格式化日期为 "2月8日 周六"
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
    return `${month}月${day}日 ${weekday}`;
}

// 获取今天和明天的日期字符串 (YYYY-MM-DD)
const getTodayStr = () => new Date().toISOString().split('T')[0];
const getTomorrowStr = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
};

// 计算两个日期相差几晚
const getNights = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.round((e - s) / (1000 * 60 * 60 * 24));
};


const { width } = Dimensions.get('window');// 获取屏幕宽度
const SWIPER_HEIGHT = 260;// 定义轮播图高度

const BANNER_IMAGES = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', // 餐厅内景
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80', // 鸡尾酒
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80', // 美食特写

];

const CITIES_DOMESTIC = ['上海', '北京', '广州', '杭州', '成都', '重庆'];

const CITIES_OVERSEAS = [
    { country: '韩国', name: '首尔' },
    { country: '日本', name: '东京' },
    { country: '法国', name: '巴黎' },
    { country: '美国', name: '旧金山' },
];


// body布局
const SearchPage = ({ navigation }: any) => {

    // ===  状态管理 ===
    // activeTab: 'domestic' | 'overseas' | 'homestay' | 'hourly'
    const [activeTab, setActiveTab] = useState('domestic');

    // 城市选择状态
    const [city, setCity] = useState({ name: '上海', country: '' });
    const [modalVisible, setModalVisible] = useState(false);

    // === 日期相关状态 ===
    const [dateModalVisible, setDateModalVisible] = useState(false);
    const [startDate, setStartDate] = useState(getTodayStr());
    const [endDate, setEndDate] = useState(getTomorrowStr());
    // 计算总晚数
    const totalNights = getNights(startDate, endDate);

    // 新增价格弹窗状态
    const [priceModalVisible, setPriceModalVisible] = useState(false);
    const [selectedPrice, setSelectedPrice] = useState<string>('');
    const [selectedStar, setSelectedStar] = useState<string>('');

    // 快捷标签的选择状态
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // 核心逻辑：生成日历的标记对象 (MarkedDates)
    // 这段代码负责把 开始日期、结束日期、中间日期 染成不同的颜色
    const markedDates = useMemo(() => {
        let marks: any = {};
        if (!startDate) return marks;

        // 1. 标记开始日期 (深蓝)
        marks[startDate] = { startingDay: true, color: '#0086F6', textColor: 'white' };

        if (endDate) {
            // 2. 标记结束日期 (深蓝)
            marks[endDate] = { endingDay: true, color: '#0086F6', textColor: 'white' };

            // 3. 标记中间的日期 (浅蓝)
            let start = new Date(startDate);
            let end = new Date(endDate);
            let curr = new Date(start);
            curr.setDate(curr.getDate() + 1);// 从开始日期的后一天开始

            while (curr < end) {
                const dateStr = curr.toISOString().split('T')[0];
                marks[dateStr] = { color: '#E6F7FF', textColor: '#333' };
                curr.setDate(curr.getDate() + 1);
            }
        }
        return marks;
    }, [startDate, endDate]);

    // 处理日历点击
    const onDayPress = (day: any) => {
        const selectedDate = day.dateString;

        // 如果还没选开始时间，或者已经选好了完整的区间 -> 重新开始选入住日
        if (!startDate || (startDate && endDate)) {
            setStartDate(selectedDate);
            setEndDate('');
        }
        // 如果已经选了开始时间，且点击的日期在开始时间之后 -> 选为离店日
        else if (startDate && !endDate) {
            if (new Date(selectedDate) > new Date(startDate)) {
                setEndDate(selectedDate);
            } else {
                // 如果点的比开始时间还早，那就把它变成新的入住日
                setStartDate(selectedDate);
                setEndDate('');
            }
        }
    };

    // 当切换 Tab 时，自动重置默认城市
    useEffect(() => {
        if (activeTab === 'overseas') {
            setCity({ name: '首尔', country: '韩国' });
        } else {
            setCity({ name: '上海', country: '' });
        }
    }, [activeTab])

    // 处理城市选择
    const handleSelectCity = (item: any) => {
        if (typeof item === 'string') {
            setCity({ name: item, country: '' });
        } else {
            setCity({ name: item.name, country: item.country });
        }
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

    // 获取当前应该显示的城市列表
    const getCurrentCityList = () => {
        return activeTab === 'overseas' ? CITIES_OVERSEAS : CITIES_DOMESTIC;
    }

    // 判断书签背景是否激活 (国内和海外共享一个书签背景)
    const isHotelGroupActive = activeTab === 'domestic' || activeTab === 'overseas';

    // 处理价格/星级多选
    const togglePrice = (p: string) => {
        if (selectedPrice === p) {
            setSelectedPrice(''); // 取消选中
        } else {
            setSelectedPrice(p); // 选中新的
        }
    };

    const toggleStar = (s: string) => {
        if (selectedStar === s) {
            setSelectedStar('');
        } else {
            setSelectedStar(s);
        }
    };

    // ✅ 新增：生成展示文字的函数
    const getPriceStarText = () => {
        if (!selectedPrice && !selectedStar) return '价格/星级';
        // 拼接字符串，中间加个空格
        return `${selectedPrice} ${selectedStar}`.trim();
    };

    // 处理标签点击（选中/取消）
    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            // 如果已存在，就移除 (变回白色)
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            // 如果不存在，就添加 (变成蓝色)
            setSelectedTags([...selectedTags, tag]);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" translucent backgroundColor="transparent" />

            {/* ✅ 1. 城市选择弹窗 (使用抽离组件) */}
            {/* 注意：如果你之前的 CitySelectorModal 没有 data 属性，请去修改组件让它接收 props.data，否则这里无法区分国内海外 */}
            <CitySelectorModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSelect={handleSelectCity}
                // ✅ 关键：根据 activeTab 动态传递不同的数据数组
                data={activeTab === 'overseas' ? CITIES_OVERSEAS : CITIES_DOMESTIC}
            />

            {/* ✅ 2. 日期选择弹窗 (使用抽离组件) */}
            <DateSelectorModal
                visible={dateModalVisible}
                onClose={() => setDateModalVisible(false)}
                startDate={startDate}
                endDate={endDate}
                onSelect={handleDateSelect}
            />

            {/* ===  价格/星级弹窗 === */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={priceModalVisible}
                onRequestClose={() => setPriceModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '70%' }]}>
                        {/* 弹窗头部 */}
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setPriceModalVisible(false)}>
                                <Ionicons name='close' size={24} color='#333' />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>选择价格/星级</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            {/* 价格部分 (Grid布局) */}
                            <Text style={styles.sectionTitle}>价格区间</Text>
                            <View style={styles.gridContainer}>
                                {PRICES.map((p, i) => {
                                    // ✅ 修改判断逻辑：等于当前字符串即为选中
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

                            {/* 星级部分 */}
                            <Text style={styles.sectionTitle}>星级/钻级</Text>
                            <View style={styles.gridContainer}>
                                {STARS.map((s, i) => {
                                    // ✅ 修改判断逻辑
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

                        {/* 底部按钮栏 */}
                        <View style={styles.filterFooter}>
                            <TouchableOpacity 
                                style={styles.resetBtn} 
                                // ✅ 修改清空逻辑：置为空字符串
                                onPress={() => { setSelectedPrice(''); setSelectedStar(''); }}
                            >
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
                {/* 布局部分，顶部 Swiper 区域 */}
                <View style={styles.wrapper}>
                    <Carousel
                        style={styles.carousel}
                        autoplay // 开启自动轮播
                        infinite // 开启无限循环
                        autoplayInterval={3000}
                        dotStyle={styles.dot}// 未选中的样式
                        dotActiveStyle={styles.activeDot} // 选中的样式
                    >
                        {
                            BANNER_IMAGES.map((imgUrl, index) => (
                                <View key={index} style={styles.slide}>
                                    <Image
                                        source={{ uri: imgUrl }}
                                        style={styles.image}
                                        resizeMode='cover'
                                    />
                                    <View style={styles.overlay}>
                                        <Text style={styles.overlayText}>
                                            {index === 0 ? '探索格调生活' : index === 1 ? '微醺时刻' : '味蕾盛宴'}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                    </Carousel>
                </View>

                {/* === 第二部分：悬浮搜索卡片 (核心修改) === */}
                <View style={styles.searchCard}>
                    {/* 1. 书签式 Tab 栏 */}
                    <View style={styles.bookmarkWrapper}>
                        <View style={[styles.bookmarkItem, isHotelGroupActive && styles.bookmarkActive]}>
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


                    {/* 2. 内容区域 (白色背景连接着激活的 Tab) */}
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
                                    style={styles.searchInput} />
                            </View>
                            <TouchableOpacity style={styles.mapIconBtn}>
                                <Ionicons name="map" size={20} color="#0086F6" />
                                <Text style={styles.mapText}>地图</Text>
                            </TouchableOpacity>
                        </View>

                        {/*  日期选择行 (点击触发) */}
                        <TouchableOpacity
                            style={styles.dateRow}
                            onPress={() => setDateModalVisible(true)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                {/* 入住日期 */}
                                <Text style={styles.dateMainText}>{formatDate(startDate)}</Text>
                                {/* <Text style={styles.dateTagText}>入住</Text> */}

                                <View style={styles.dateDivider} />

                                {/* 离店日期 */}
                                <Text style={styles.dateMainText}>{endDate ? formatDate(endDate) : '请选择'}</Text>
                                {/* <Text style={styles.dateTagText}>离开</Text> */}
                            </View>

                            {/* 右侧：共几晚 */}
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.nightCountText}>共{totalNights}晚</Text>
                                <Ionicons name="chevron-forward" size={16} color="#ccc" />
                            </View>
                        </TouchableOpacity>

                        {/*  价格/星级选择行 */}
                        <TouchableOpacity
                            style={styles.priceRow}
                            onPress={() => setPriceModalVisible(true)}
                        >
                            <Text style={[
                                styles.priceRowText, 
                                // 如果有选中内容，文字变黑；没选中则变灰
                                (selectedPrice || selectedStar) && { color: '#333', fontWeight: 'bold' }
                            ]}>
                                {getPriceStarText()}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="#ccc" />
                        </TouchableOpacity>

                        {/* 快捷标签 */}
                        <View style={styles.quickTagsWrapper}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={{ marginLeft: -5 }}
                            >
                                {QUICK_TAGS.map((tag, index) => {
                                    // 判断当前标签是否被选中
                                    const isSelected = selectedTags.includes(tag);

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => toggleTag(tag)}
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
                                                {tag}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* 点击按钮跳转到列表页 */}
                        <TouchableOpacity
                            style={styles.searchBtn}
                            onPress={() => navigation.navigate('List', {
                                //  把当前页面的状态打包传过去
                                activeTab: activeTab,
                                city: city, // 把选中的城市也传过去，防止列表页默认又是上海
                                startDate: startDate,
                                endDate: endDate,
                                price: selectedPrice,
                                star: selectedStar
                            })}
                        >
                            <Text style={styles.searchBtnText}>查 询</Text>
                        </TouchableOpacity>

                    </View>
                </View>

                {/* 页面底部其他内容占位 */}
                <View style={{ padding: 20 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>本周特惠</Text>
                    <View style={{ height: 100, backgroundColor: '#f0f0f0', borderRadius: 8 }} />
                </View>
            </ScrollView>
        </View>
    );
};


// style样式
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // 整体背景白
    },
    scrollContent: {
        paddingBottom: 20,
    },
    wrapper: {
        height: SWIPER_HEIGHT,
        width: '100%'
    },
    carousel: {
        height: SWIPER_HEIGHT,
        width: '100%', // 占满容器
        backgroundColor: '#eee', // 加载出来前的背景色
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    image: {
        width: width,
        height: SWIPER_HEIGHT,
    },
    dot: {
        backgroundColor: 'rgba(255,255,255,0.4)',// 背景颜色
        width: 8,
        height: 8,
        borderRadius: 4, // 弧角度数
        marginHorizontal: 3,
        marginBottom: 10,
    },
    activeDot: {
        backgroundColor: '#fff',
        width: 20,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 3,
        marginBottom: 10,
    },

    // === 书签式卡片容器 ===
    searchCard: {
        marginHorizontal: 12,
        marginTop: -40, // 负margin上移
        // 注意：这里去掉了背景色和圆角，移交给子元素处理
    },
    overlay: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4
    },
    overlayText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },

    // 书签 Tab 栏
    bookmarkWrapper: {
        flexDirection: 'row',
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.85)', // 未选中的背景色 (半透明白)
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        overflow: 'hidden', // 裁切圆角
    },
    bookmarkItem: {
        flex: 1, // 均分宽度
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    bookmarkActive: {
        backgroundColor: '#fff', // 选中变纯白，和下面的 cardContent 融为一体
    },
    splitTabRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#0086F6',
        fontWeight: 'bold',
        fontSize: 17,
    },
    activeLine: {
        position: 'absolute',
        bottom: -6,
        left: '20%',
        width: '60%',
        height: 3,
        backgroundColor: '#0086F6',
        borderRadius: 2,
    },

    // 卡片内容区 (白色主体)
    cardContent: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        padding: 16,
        paddingTop: 20, // 增加顶部内边距
        // 阴影
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },

    // === 城市与搜索行 ===
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center', // 垂直居中
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 15,
    },
    citySelector: {
        marginRight: 15,
        minWidth: 70, // 给个最小宽度防止跳动
    },
    countryText: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2, // 让国家显示在左上角
    },
    cityText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    inputWrapper: {
        flex: 1,
        height: 40,
        justifyContent: 'center',
    },
    searchInput: {
        fontSize: 16,
        color: '#333',
    },
    mapIconBtn: {
        alignItems: 'center',
        marginLeft: 10,
    },
    mapCircle: {
        width: 24, height: 24,
        borderWidth: 1, borderColor: '#0086F6', borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 2,
    },
    mapText:
    {
        fontSize: 10,
        color: '#0086F6'
    },

    //  日期行样式
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

    dateTagText: {
        fontSize: 12,
        color: '#999',
        marginLeft: 4,
        marginRight: 8,
        marginTop: 2
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

    // ✅ 价格行样式
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
    }, // 默认灰色，像 placeholder

    // ✅ 快捷标签样式
    quickTagsWrapper: {
        marginTop: 0,
        marginBottom: 10
    },
    // ✅ 快捷标签基础样式 (未选中)
    tagItem: {
        backgroundColor: '#f5f7fa',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 4,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent' // 预留边框位置，防止选中时抖动
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

    // 查询按钮
    searchBtn: {
        backgroundColor: '#0086F6',
        height: 48,
        borderRadius: 24, // 圆角按钮
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#0086F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    searchBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },

    // === 弹窗样式 ===
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end', // 底部弹出
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '50%', // 占屏幕一半高度
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },

    // ✅ 价格弹窗特有样式
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333'
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    gridItem: {
        width: '30%', // 一行三个
        backgroundColor: '#f5f7fa',
        paddingVertical: 10,
        borderRadius: 6,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
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
});





export default SearchPage;