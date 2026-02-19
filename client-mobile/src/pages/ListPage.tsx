import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ListHeader from '../components/ListHeader';
import CitySelectorModal from '../components/CitySelectorModal';
import DateSelectorModal from '../components/DateSelectorModal';

// 1. 定义数据 
const CITIES_DOMESTIC = ['上海', '北京', '广州', '杭州', '成都', '重庆', '深圳', '西安'];
const CITIES_OVERSEAS = [
    { country: '韩国', name: '首尔' }, 
    { country: '日本', name: '东京' }, 
    { country: '美国', name: '旧金山' },
    { country: '法国', name: '巴黎' }
];

// 模拟列表数据
const HOTEL_LIST = [
    { id: '1', name: '上海半岛酒店', score: 4.9, price: 2800, img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500' },
    { id: '2', name: '上海外滩W酒店', score: 4.8, price: 1900, img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500' },
    { id: '3', name: '上海和平饭店', score: 4.7, price: 2100, img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=500' },
];

// 接收 route 参数
const ListPage = ({ navigation, route }: any) => {
    // 从路由参数中解构数据，如果没传则使用默认值
    const { 
        activeTab: paramTab = 'domestic', // 默认为国内
        city: paramCity = { name: '上海' }, 
        startDate: paramStart = '2026-02-12', 
        endDate: paramEnd = '2026-02-13' 
    } = route.params || {};

    // 状态管理 (初始化时使用传入的参数)
    const [activeTab, setActiveTab] = useState(paramTab); 
    const [city, setCity] = useState(paramCity.name || '上海'); // 这里简化处理，只存名字
    const [startDate, setStartDate] = useState(paramStart);
    const [endDate, setEndDate] = useState(paramEnd);
    
    const [activeModal, setActiveModal] = useState<'none' | 'city' | 'date'>('none');

    // ✅ 核心逻辑：根据 activeTab 决定弹窗显示哪组数据
    const getCurrentCityList = () => {
        return activeTab === 'overseas' ? CITIES_OVERSEAS : CITIES_DOMESTIC;
    };

    const handleCapsulePress = () => {
        setActiveModal('city');
    };

    const handleCitySelect = (newCity: any) => {
        // 兼容字符串和对象
        if (typeof newCity === 'string') {
            setCity(newCity);
        } else {
            setCity(newCity.name);
        }
        // 选完城市自动跳日期
        setActiveModal('date'); 
    };

    const handleDateSelect = (dateStr: string) => {
        if (!startDate || (startDate && endDate)) {
            setStartDate(dateStr); setEndDate('');
        } else if (startDate && !endDate) {
            if (dateStr > startDate) setEndDate(dateStr);
            else setStartDate(dateStr);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            
            <ListHeader 
                city={city}
                startDate={startDate}
                endDate={endDate}
                onBack={() => navigation.goBack()}
                onPressCapsule={handleCapsulePress}
            />

            <FlatList
                data={HOTEL_LIST}
                keyExtractor={item => item.id}
                contentContainerStyle={{padding: 10}}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Image source={{ uri: item.img }} style={styles.cardImg} />
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardName}>{item.name}</Text>
                            <Text style={styles.cardScore}>{item.score}分 超棒</Text>
                            <Text style={styles.cardPrice}>¥{item.price}<Text style={{fontSize: 12, color: '#999'}}>起</Text></Text>
                        </View>
                    </View>
                )}
            />

            {/* ✅ 传递动态数据给弹窗 */}
            <CitySelectorModal 
                visible={activeModal === 'city'} 
                onClose={() => setActiveModal('none')}
                onSelect={handleCitySelect}
                // 这里传入根据 activeTab 判断后的数据
                // @ts-ignore
                data={getCurrentCityList()}
            />
            
            <DateSelectorModal 
                visible={activeModal === 'date'}
                startDate={startDate}
                endDate={endDate}
                onClose={() => setActiveModal('none')}
                onSelect={handleDateSelect}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    card: { flexDirection: 'row', backgroundColor: '#fff', marginBottom: 10, borderRadius: 8, overflow: 'hidden' },
    cardImg: { width: 100, height: 120 },
    cardInfo: { flex: 1, padding: 10, justifyContent: 'space-between' },
    cardName: { fontSize: 16, fontWeight: 'bold' },
    cardScore: { color: '#0086F6', fontWeight: 'bold' },
    cardPrice: { fontSize: 20, color: '#ff4d4f', fontWeight: 'bold', textAlign: 'right' }
});

export default ListPage;