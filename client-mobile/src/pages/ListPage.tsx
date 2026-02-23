import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import ListHeader from '../components/ListHeader';
import DateSelectorModal from '../components/DateSelectorModal';
import { SEARCH_HOTELS } from '../graphql/hotel-h5';

// 辅助：处理图片链接
const formatImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/300x400?text=No+Image'; // 默认图
    return url.startsWith('http') ? url : `https://${url}`;
};

// 辅助：格式化数字 (63000 -> 6.3万)
const formatCount = (count: number) => {
    if (!count) return '0';
    return count > 10000 ? `${(count / 10000).toFixed(1)}万` : count;
};

// 2. 辅助函数：生成星星数组
const renderStars = (count: number) => {
    // 限制在 0-5 之间，如果没有星级默认给 3 星
    const starCount = Math.max(0, Math.min(5, count || 3)); 
    const stars = [];
    for (let i = 0; i < starCount; i++) {
        stars.push(
            <Ionicons key={i} name="star" size={14} color="#FFD700" style={{ marginLeft: 2 }} />
        );
    }
    return stars;
};

const ListPage = ({ navigation, route }: any) => {
    const {
        cityCode = '320100', checkIn, checkOut, keyword = '',
        minPrice, maxPrice, starRating, tags, displayInfo = {}
    } = route.params || {};

    const [currentCheckIn, setCheckIn] = useState(checkIn);
    const [currentCheckOut, setCheckOut] = useState(checkOut);
    const [activeModal, setActiveModal] = useState<'none' | 'date'>('none');

    // GraphQL 查询
    const { data, loading, error, refetch } = useQuery(SEARCH_HOTELS, {
        fetchPolicy: 'network-only',
        variables: {
            input: {
                // ✅ 保留这些核心参数
                cityCode: cityCode,
                checkIn: currentCheckIn,
                checkOut: currentCheckOut,
                keyword: keyword,
                minPrice: minPrice,
                maxPrice: maxPrice,
                star: starRating, // 如果报错，可能这个也要删，先留着试试
                
                // ❌ 删掉 features (后端说不认识)
                // features: tags, 
                
                // ❌ 删掉 pageNum 和 pageSize (后端说不认识，它自己会用默认值)
                // pageNum: 1,            
                // pageSize: 20
            }
        },
        onError: (err) => {
            console.log("❌ 酒店搜索请求失败:", JSON.stringify(err, null, 2));
        }
    });

    if (data) {
        console.log("✅ 获取到数据:", JSON.stringify(data, null, 2));
    }

    const hotelList = useMemo(() => data?.searchHotels?.data?.items || [], [data]);

    // 🏷️ 渲染单个卡片 (完全复刻效果图)
    const renderItem = ({ item }: any) => {
        // 1. 取封面图
        const coverImage = (item.images && item.images.length > 0) ? item.images[0].url : '';

        // 2. 动态标签逻辑
        const dynamicTags = [];
        // 免费取消
        if (item.roomType?.some((r: any) => r.refundable)) {
            dynamicTags.push({ text: '免费取消', color: '#0086F6', bg: '#F0F8FF' }); // 蓝字浅蓝底
        }
        // 含早餐
        if (item.roomType?.some((r: any) => r.hasBreakfast)) {
            dynamicTags.push({ text: '含早餐', color: '#333', bg: '#F5F5F5' }); // 黑字灰底
        }
        // 有窗
        if (item.roomType?.some((r: any) => r.hasWindow)) {
            dynamicTags.push({ text: '有窗', color: '#333', bg: '#F5F5F5' });
        }
        // 兜底标签 (如果没有房型数据，为了好看先显示一个)
        if (dynamicTags.length === 0) {
            dynamicTags.push({ text: '大床房', color: '#333', bg: '#F5F5F5' });
        }

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Detail', { id: item.id })}
            >
                {/* 左侧大图 (3:4 比例) */}
                <View style={styles.imageWrapper}>
                    <Image source={{ uri: formatImageUrl(coverImage) }} style={styles.cardImg} resizeMode="cover" />
                    {/* 可选：图片左下角加个 icon 模拟效果图 */}
                    <View style={styles.playIcon}>
                        <Ionicons name="play" size={12} color="#fff" />
                    </View>
                </View>

                {/* 右侧信息区 */}
                <View style={styles.cardInfo}>
                    {/* 标题 */}
                    <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>

                    {/* 评分行：4.8 超棒 ... */}
                    <View style={styles.scoreRow}>
                        <View style={styles.scoreBadge}>
                            <Text style={styles.scoreText}>{item.score || '4.8'}</Text>
                        </View>
                        <Text style={styles.scoreDesc}>超棒</Text>
                        <Text style={styles.commentText}>
                            {formatCount(item.favoriteCount || 2300)}条点评 · {formatCount(item.favoriteCount || 5000)}收藏
                        </Text>
                    </View>

                    {/* 位置距离 */}
                    <Text style={styles.locationText} numberOfLines={1}>
                        {item.distanceText || '市中心'} · {item.address}
                    </Text>

                    {/* 标签行 (动态渲染) */}
                    <View style={styles.tagRow}>
                        {dynamicTags.slice(0, 3).map((tag, i) => (
                            <View key={i} style={[styles.tagContainer, { backgroundColor: tag.bg }]}>
                                <Text style={[styles.tagText, { color: tag.color }]}>{tag.text}</Text>
                            </View>
                        ))}
                    </View>

                    {/* 价格与营销标签 */}
                    <View style={styles.bottomRow}>
                        <View style={styles.promoTag}>
                            <Text style={styles.promoText}>钻石贵宾价</Text>
                        </View>
                        <View style={styles.priceContainer}>
                            <Text style={styles.currency}>¥</Text>
                            <Text style={styles.price}>{item.minPrice || '待定'}</Text>
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
            <ListHeader
                city={displayInfo.cityName || '南京'}
                startDate={currentCheckIn} endDate={currentCheckOut}
                onBack={() => navigation.goBack()} onPressCapsule={() => setActiveModal('date')}
            />
            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#0086F6" /></View>
            ) : (
                <FlatList
                    data={hotelList}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                />
            )}
            <DateSelectorModal
                visible={activeModal === 'date'}
                startDate={currentCheckIn} endDate={currentCheckOut}
                onClose={() => setActiveModal('none')}
                onSelect={(d) => { /* 简化的日期逻辑 */ setCheckIn(d); setActiveModal('none'); }}
            />
        </View>
    );
};

// 🎨 样式部分 (关键！)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { flexDirection: 'row', backgroundColor: '#fff', marginBottom: 12, borderRadius: 12, overflow: 'hidden', padding: 10 },

    // 左侧图片
    imageWrapper: { width: 110, height: 150, borderRadius: 8, overflow: 'hidden', position: 'relative' },
    cardImg: { width: '100%', height: '100%' },
    playIcon: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },

    // 右侧布局
    cardInfo: { flex: 1, marginLeft: 10, justifyContent: 'space-between' },
    cardName: { fontSize: 16, fontWeight: 'bold', color: '#333', lineHeight: 22 },

    // 评分行
    scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    scoreBadge: { backgroundColor: '#0086F6', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, marginRight: 4 },
    scoreText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    scoreDesc: { color: '#0086F6', fontSize: 12, fontWeight: 'bold', marginRight: 6 },
    commentText: { color: '#666', fontSize: 11 },

    locationText: { color: '#999', fontSize: 11, marginTop: 4 },

    // 标签行
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
    tagContainer: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, marginRight: 4, marginBottom: 4 },
    tagText: { fontSize: 10 },

    // 底部价格行
    bottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 },
    promoTag: { borderColor: '#FF4D4F', borderWidth: 0.5, borderRadius: 2, paddingHorizontal: 4, paddingVertical: 1 },
    promoText: { color: '#FF4D4F', fontSize: 10 },

    priceContainer: { flexDirection: 'row', alignItems: 'flex-end' },
    currency: { color: '#0086F6', fontSize: 12, marginBottom: 3, fontWeight: 'bold' },
    price: { color: '#0086F6', fontSize: 20, fontWeight: 'bold', lineHeight: 22 },
    qi: { color: '#999', fontSize: 10, marginBottom: 3, marginLeft: 1 }
});

export default ListPage;