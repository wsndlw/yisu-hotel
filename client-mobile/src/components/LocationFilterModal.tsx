import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePoiList } from '../services/hotel-h5';

const CATEGORIES = [
    { key: 'ALL', label: '热门' },
];

interface Props {
    visible: boolean;
    cityCode: string;
    onClose: () => void;
    onSelect: (poi: any) => void;
}

const LocationFilterModal = ({ visible, cityCode, onClose, onSelect }: Props) => {
    console.log("📍 Modal接收到的城市:", cityCode)
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [selectedPoiId, setSelectedPoiId] = useState<string>('');

    const { data: poiList, loading } = usePoiList({ city: cityCode });

    const displayList = useMemo(() => {
        if (!poiList || poiList.length === 0) return [];
        return poiList; 
    }, [poiList]);

    const handleSelect = (poi: any) => {
        if (poi) {
            setSelectedPoiId(poi.id); // 只有 poi 存在才读 id
        } else {
            setSelectedPoiId(''); // poi 是 null (不限)，ID 置空
        }
        
        setTimeout(() => {
            onSelect(poi);
            onClose();
        }, 200);
    };

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.mask} onPress={onClose} />
                
                <View style={styles.container}>
                    {/* 左侧菜单 */}
                    <View style={styles.leftMenu}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.key}
                                style={[styles.menuItem, activeCategory === cat.key && styles.menuItemActive]}
                                onPress={() => setActiveCategory(cat.key)}
                            >
                                <Text style={[styles.menuText, activeCategory === cat.key && styles.menuTextActive]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* 右侧列表 */}
                    <View style={styles.rightList}>
                        {loading ? (
                            <ActivityIndicator style={{ marginTop: 20 }} color="#0086F6" />
                        ) : displayList.length > 0 ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* 不限选项 */}
                                <TouchableOpacity style={styles.poiItem} onPress={() => handleSelect(null)}>
                                    <Text style={[styles.poiName, !selectedPoiId && styles.activeColor]}>不限</Text>
                                    {!selectedPoiId && <Ionicons name="checkmark" size={18} color="#0086F6" />}
                                </TouchableOpacity>

                                {displayList.map((poi: any) => (
                                    <TouchableOpacity 
                                        key={poi.id} 
                                        style={styles.poiItem} 
                                        onPress={() => handleSelect(poi)}
                                    >
                                        <View>
                                            <Text style={[styles.poiName, selectedPoiId === poi.id && styles.activeColor]}>
                                                {poi.name}
                                            </Text>
                                        </View>
                                        {selectedPoiId === poi.id && <Ionicons name="checkmark" size={18} color="#0086F6" />}
                                    </TouchableOpacity>
                                ))}
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>暂无相关地点</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    mask: { flex: 1 },
    container: { 
        backgroundColor: '#fff', 
        height: 400, 
        marginTop: 130, 
        flexDirection: 'row',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        overflow: 'hidden'
    },
    leftMenu: { width: 100, backgroundColor: '#f5f7fa' },
    menuItem: { height: 50, justifyContent: 'center', alignItems: 'center' },
    menuItemActive: { backgroundColor: '#fff' },
    menuText: { fontSize: 13, color: '#666' },
    menuTextActive: { color: '#0086F6', fontWeight: 'bold' },

    rightList: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 15 },
    poiItem: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#eee' 
    },
    poiName: { fontSize: 14, color: '#333' },
    activeColor: { color: '#0086F6', fontWeight: 'bold' },
    
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#999', fontSize: 13 }
});

export default LocationFilterModal;