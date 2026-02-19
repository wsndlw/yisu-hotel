import React from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 定义海外城市的数据结构接口
interface OverseasCity {
    country: string;
    name: string;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    // onSelect 既可能接收字符串，也可能接收对象
    onSelect: (city: string | OverseasCity) => void;
    // ✅ 新增 data 属性：接收外部传进来的城市列表
    data: (string | OverseasCity)[]; 
}

const CitySelectorModal: React.FC<Props> = ({ visible, onClose, onSelect, data }) => {
    return (
        <Modal animationType='slide' transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>选择城市</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name='close' size={24} color='#333' />
                        </TouchableOpacity>
                    </View>
                    
                    <FlatList
                        // ✅ 使用传入的 data，而不是写死的数据
                        data={data}
                        
                        // ✅ Key 提取器：如果是字符串直接用，如果是对象用 name
                        keyExtractor={(item, index) => {
                            if (typeof item === 'string') return item + index;
                            return item.name + index;
                        }}
                        
                        // ✅ 渲染逻辑：根据类型显示不同的 UI
                        renderItem={({ item }) => {
                            // 判断是否为字符串 (国内城市)
                            const isString = typeof item === 'string';
                            
                            return (
                                <TouchableOpacity 
                                    style={styles.cityItem} 
                                    onPress={() => onSelect(item)}
                                >
                                    <Text style={styles.cityText}>
                                        {/* 如果是字符串直接显示，如果是对象显示 "国家 · 城市" */}
                                        {isString ? item : `${item.country} · ${item.name}`}
                                    </Text>
                                    
                                    {/* (可选) 如果是海外，可以给个小标签或者不同的样式 */}
                                    {!isString && (
                                        <Ionicons name="airplane-outline" size={16} color="#ccc" />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '60%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    cityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    cityText: { fontSize: 16, color: '#333' },
});

export default CitySelectorModal;