import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    city: string;
    startDate: string;
    endDate: string;
    onPressCapsule: () => void; // 点击胶囊触发弹窗
    onBack: () => void;
}

const ListHeader: React.FC<Props> = ({ city, startDate, endDate, onPressCapsule, onBack }) => {
    // 简单的日期格式化：2026-02-12 -> 02-12
    const fmt = (s: string) => s ? s.slice(5) : '';
    // 计算晚数
    const nights = startDate && endDate ? Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) : 0;

    return (
        <View style={styles.container}>
            {/* 1. 返回按钮 */}
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={28} color="#000" />
            </TouchableOpacity>

            {/* 2. 核心：城市/日期胶囊按钮 (点击这里弹出选择) */}
            <TouchableOpacity style={styles.capsule} onPress={onPressCapsule}>
                <View style={styles.citySection}>
                    <Text style={styles.cityText}>{city}</Text>
                </View>
                
                {/* 竖线分割 */}
                <View style={styles.verticalDivider} />

                <View style={styles.dateSection}>
                    <View style={styles.dateRow}>
                        <Text style={styles.dateText}>{fmt(startDate)}</Text>
                        <Text style={styles.nightText}>{nights}晚</Text>
                    </View>
                    <View style={styles.dateRow}>
                        <Text style={styles.dateText}>{fmt(endDate)}</Text>
                        <Text style={styles.nightText}>1人</Text>
                    </View>
                </View>

                {/* 小三角 */}
                <Ionicons name="caret-down" size={10} color="#666" style={{marginLeft: 4}} />
            </TouchableOpacity>

            {/* 3. 搜索框 (视觉展示，实际可点击跳回搜索页) */}
            <View style={styles.searchBox}>
                <Ionicons name="search" size={16} color="#999" />
                <Text style={styles.placeholder}>位置/品牌/酒店</Text>
            </View>

            {/* 4. 地图/更多图标 */}
            <TouchableOpacity style={styles.iconBtn}>
                 <Ionicons name="map-outline" size={24} color="#000" />
                 <Text style={{fontSize: 9, color: '#333'}}>地图</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingBottom: 10,
        backgroundColor: '#fff',
        // 适配刘海屏
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 50,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backBtn: { paddingRight: 10 },
    
    // 胶囊样式
    capsule: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
        borderRadius: 20, // 圆角胶囊
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 10,
        height: 40,
    },
    citySection: { marginRight: 8 },
    cityText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    
    verticalDivider: { width: 1, height: 20, backgroundColor: '#ddd', marginRight: 8 },
    
    dateSection: { justifyContent: 'center' },
    dateRow: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontSize: 11, color: '#333', fontWeight: '500', marginRight: 4 },
    nightText: { fontSize: 9, color: '#999' },

    // 搜索框样式
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
        height: 40,
        borderRadius: 20,
        paddingHorizontal: 12,
    },
    placeholder: { fontSize: 14, color: '#999', marginLeft: 6 },

    iconBtn: { alignItems: 'center', marginLeft: 12 },
});

export default ListHeader;